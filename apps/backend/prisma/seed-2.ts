// Masodik seed - bovebb teszt adat a legutobbi sema alapjan.
//
// Az elso seed-del (seed.ts) ellentetben ez NEM torol mindent: csak a sajat,
// korabban letrehozott sorait torli ujrafuttataskor (a "@seed2.teszt.hu"
// email-cimu felhasznalok es a SEED2_TAX_IDS cegek alapjan), igy az elso seed
// adatai megmaradnak, es tetszoleges sorrendben futtathatok.
//
// Az adatok determinisztikusak (fix seed-u PRNG), ezert minden futtataskor
// ugyanazokat a sorokat kapod. Az id-kat itt generaljuk (randomUUID), hogy a
// gyerektablakat gyors createMany-vel lehessen feltolteni.
//
// Minden osszeg RON-ban van. Minden sor synced = true (alapertelmezes), es
// minden csatolmany UPLOADED, mert ezek a kozponti adatbazisban vannak - az
// offline/nem szinkronizalt allapot csak a mobil SQLite-ban ertelmezett.

import {PrismaClient} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {randomUUID} from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();

const EMAIL_DOMAIN = '@seed2.teszt.hu';
const SEED2_TAX_IDS = ['23456789-2-13', '34567890-2-42', '45678901-2-09'];
const TODAY = new Date('2026-10-22');

// ---------- segedfuggvenyek ----------

// mulberry32 - kicsi, determinisztikus PRNG
let rngState = 20261022;
function rand(): number {
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// ---------- torzsadatok ----------

const companies = [
  {name: 'Gyors Futar Bt.', taxId: SEED2_TAX_IDS[0]},
  {name: 'Alfold Logisztika Kft.', taxId: SEED2_TAX_IDS[1]},
  {name: 'Varosi Taxi Zrt.', taxId: SEED2_TAX_IDS[2]},
];

// companyIndex: null = maganszemely
const users = [
  {firstName: 'Csaba', lastName: 'Toth', role: 'PRIVATE', companyIndex: null},
  {firstName: 'Dora', lastName: 'Szabo', role: 'PRIVATE', companyIndex: null},
  {firstName: 'Erik', lastName: null, role: 'PRIVATE', companyIndex: null},
  {firstName: 'Fanni', lastName: 'Horvath', role: 'COMPANY_ADMIN', companyIndex: 0},
  {firstName: 'Gabor', lastName: 'Varga', role: 'COMPANY_MEMBER', companyIndex: 0},
  {firstName: 'Hajnalka', lastName: 'Kovacs', role: 'COMPANY_ADMIN', companyIndex: 1},
  {firstName: 'Istvan', lastName: 'Molnar', role: 'COMPANY_MEMBER', companyIndex: 1},
  {firstName: 'Judit', lastName: 'Farkas', role: 'COMPANY_ADMIN', companyIndex: 2},
  {firstName: 'Kalman', lastName: 'Balogh', role: 'COMPANY_MEMBER', companyIndex: 2},
  {firstName: 'Laura', lastName: 'Papp', role: 'COMPANY_MEMBER', companyIndex: 2},
] as const;

// ownerIndex: a users tomb indexe; a ceges jarmuvek a tulajdonos cegehez tartoznak
const vehicles = [
  {
    owner: 0,
    make: 'Skoda',
    model: 'Octavia',
    year: 2018,
    engine: '2.0 TDI',
    fuel: 'DIESEL',
    plate: 'SKD-001',
    bought: '2020-02-14',
    startKm: 98000,
    category: 'CATEGORY_A',
  },
  {
    owner: 0,
    make: 'Suzuki',
    model: 'Swift',
    year: 2012,
    engine: '1.2',
    fuel: 'GASOLINE',
    plate: 'SWF-002',
    bought: '2017-07-01',
    startKm: 141000,
    category: 'CATEGORY_A',
  },
  {
    owner: 1,
    make: 'Toyota',
    model: 'Corolla',
    year: 2021,
    engine: '1.8 Hybrid',
    fuel: 'HYBRID',
    plate: 'TYC-003',
    bought: '2021-09-30',
    startKm: 21000,
    category: 'CATEGORY_A',
  },
  {
    owner: 1,
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    engine: 'Long Range',
    fuel: 'ELECTRIC',
    plate: 'TSL-004',
    bought: '2023-04-18',
    startKm: 5000,
    category: 'CATEGORY_A',
  },
  {
    owner: 2,
    make: 'Opel',
    model: 'Astra',
    year: 2010,
    engine: '1.6 LPG',
    fuel: 'LPG',
    plate: 'OPA-005',
    bought: '2018-11-05',
    startKm: 205000,
    category: 'CATEGORY_A',
  },
  {
    owner: 3,
    make: 'Renault',
    model: 'Kangoo',
    year: 2019,
    engine: '1.5 dCi',
    fuel: 'DIESEL',
    plate: 'RKG-006',
    bought: '2019-03-01',
    startKm: 64000,
    category: 'CATEGORY_B',
  },
  {
    owner: 4,
    make: 'Fiat',
    model: 'Doblo',
    year: 2017,
    engine: '1.6 MultiJet',
    fuel: 'DIESEL',
    plate: 'FDB-007',
    bought: '2017-06-12',
    startKm: 152000,
    category: 'CATEGORY_B',
  },
  {
    owner: 5,
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2020,
    engine: '2.1 CDI',
    fuel: 'DIESEL',
    plate: 'MSP-008',
    bought: '2020-01-20',
    startKm: 118000,
    category: 'CATEGORY_C',
  },
  {
    owner: 6,
    make: 'Iveco',
    model: 'Daily',
    year: 2016,
    engine: '3.0 HPT',
    fuel: 'DIESEL',
    plate: 'IVD-009',
    bought: '2016-10-10',
    startKm: 287000,
    category: 'CATEGORY_D',
  },
  {
    owner: 7,
    make: 'Toyota',
    model: 'Prius',
    year: 2019,
    engine: '1.8 Hybrid',
    fuel: 'HYBRID',
    plate: 'TXI-010',
    bought: '2019-05-05',
    startKm: 231000,
    category: 'CATEGORY_A',
  },
  {
    owner: 8,
    make: 'Skoda',
    model: 'Superb',
    year: 2022,
    engine: '2.0 TDI',
    fuel: 'DIESEL',
    plate: 'TXI-011',
    bought: '2022-02-02',
    startKm: 96000,
    category: 'CATEGORY_A',
  },
  {
    owner: 9,
    make: 'Dacia',
    model: 'Logan',
    year: 2015,
    engine: '1.4 LPG',
    fuel: 'LPG',
    plate: 'TXI-012',
    bought: '2015-08-08',
    startKm: 312000,
    category: 'CATEGORY_A',
  },
] as const;

const KM_PER_MONTH: Record<string, number> = {
  GASOLINE: 900,
  DIESEL: 2200,
  HYBRID: 1800,
  ELECTRIC: 1300,
  LPG: 2500,
};

const OPERATION_COSTS: Record<string, [number, number]> = {
  OIL_CHANGE: [250, 500],
  TIRE_ROTATION: [60, 120],
  TIRE_REPLACEMENT: [900, 2400],
  BRAKE_SERVICE: [300, 900],
  BATTERY: [400, 800],
  FILTER_CHANGE: [80, 250],
  INSPECTION: [150, 250],
  OTHER: [50, 500],
};
const OPERATION_TYPES = Object.keys(OPERATION_COSTS);

const OBD_CODES = [
  {code: 'P0101', description: 'Legtomegmero jel tartomanyon kivul', severity: 'WARNING'},
  {code: 'P0171', description: 'Tul szegeny keverek (1. hengersor)', severity: 'WARNING'},
  {code: 'P0300', description: 'Veletlenszeru gyujtaskimaradas', severity: 'CRITICAL'},
  {code: 'P0401', description: 'EGR atfolyas elegtelen', severity: 'WARNING'},
  {code: 'P0420', description: 'Katalizator hatasfok', severity: 'INFO'},
  {code: 'P0442', description: 'Kis szivargas a parolgasgatlo rendszerben', severity: 'INFO'},
  {code: 'P2002', description: 'DPF hatasfok kuszob alatt', severity: 'WARNING'},
  {code: 'P0562', description: 'Alacsony rendszerfeszultseg', severity: 'CRITICAL'},
  {code: 'U0100', description: 'Kommunikacio megszakadt a motorvezerlovel', severity: 'CRITICAL'},
];

const EVENT_TEMPLATES = [
  {type: 'parking', note: 'Belvarosi parkolas', amount: [5, 25]},
  {type: 'car_wash', note: 'Kezi moso', amount: [20, 60]},
  {type: 'toll', note: 'Hidpenz / utdij', amount: [15, 40]},
  {type: 'oil_level', note: 'Olajszint ellenorizve, rendben', amount: null},
  {type: 'tire_pressure', note: 'Guminyomas beallitva', amount: null},
  {type: 'regeneration', note: 'DPF regeneracio autopalyan', amount: null},
  {type: 'note', note: 'Furcsa zorej hideginditaskor', amount: null},
] as const;

const INSURERS = ['Allianz Hungaria', 'Generali', 'Groupama', 'K&H Biztosito', 'Union'];

// ---------- torles (csak a seed-2 sajat adatai) ----------

async function cleanup() {
  const oldUsers = await prisma.user.findMany({
    where: {email: {endsWith: EMAIL_DOMAIN}},
    select: {id: true},
  });
  const userIds = oldUsers.map((u) => u.id);
  const oldVehicles = await prisma.vehicle.findMany({
    where: {ownerUserId: {in: userIds}},
    select: {id: true},
  });
  const vehicleIds = oldVehicles.map((v) => v.id);

  // NoAction kapcsolatok miatt: eloszor a hivatkozo sorok, utana a jarmu/user
  await prisma.notification.deleteMany({
    where: {OR: [{userId: {in: userIds}}, {vehicleId: {in: vehicleIds}}]},
  });
  await prisma.attachment.deleteMany({
    where: {OR: [{userId: {in: userIds}}, {vehicleId: {in: vehicleIds}}]},
  });
  await prisma.vehicleEvent.deleteMany({
    where: {OR: [{userId: {in: userIds}}, {vehicleId: {in: vehicleIds}}]},
  });
  await prisma.vehicle.deleteMany({where: {id: {in: vehicleIds}}}); // gyerektablak cascade
  await prisma.refreshToken.deleteMany({where: {userId: {in: userIds}}});
  await prisma.user.deleteMany({where: {id: {in: userIds}}});
  await prisma.company.deleteMany({where: {taxId: {in: SEED2_TAX_IDS}}});
}

// ---------- fo seed ----------

async function main() {
  await cleanup();

  const passwordHash = await bcrypt.hash('Teszt1234!', 10);

  // Company -> User -> Vehicle sorrend (FK-k)
  const companyIds = companies.map(() => randomUUID());
  await prisma.company.createMany({
    data: companies.map((c, i) => ({id: companyIds[i], ...c})),
  });

  const userIds = users.map(() => randomUUID());
  await prisma.user.createMany({
    data: users.map((u, i) => ({
      id: userIds[i],
      email: `${u.firstName.toLowerCase()}${EMAIL_DOMAIN}`,
      passwordHash,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      companyId: u.companyIndex === null ? null : companyIds[u.companyIndex],
    })),
  });

  await prisma.refreshToken.createMany({
    data: userIds.slice(0, 5).map((userId, i) => ({
      userId,
      token: `seed2-refresh-token-${i + 1}`,
      expiresAt: addDays(TODAY, 60),
      revoked: i === 4,
    })),
  });

  const maintenanceLogs: {
    id: string;
    vehicleId: string;
    serviceDate: Date;
    mileageAtService: number;
    totalCost: number;
    notes: string | null;
  }[] = [];
  const operations: {maintenanceLogId: string; type: string; cost: number; notes: string | null}[] =
    [];
  const predictions: {
    vehicleId: string;
    maintenanceType: string;
    predictedDueDate: Date | null;
    predictedDueMileage: number | null;
    status: string;
  }[] = [];
  const fuelLogs: {
    vehicleId: string;
    date: Date;
    mileage: number;
    quantity: number;
    unit: string;
    cost: number;
    fullTank: boolean;
  }[] = [];
  const insurances: {
    vehicleId: string;
    provider: string;
    policyNumber: string;
    startDate: Date;
    endDate: Date;
    cost: number;
  }[] = [];
  const taxes: {
    vehicleId: string;
    category: string;
    year: number;
    amount: number;
    dueDate: Date;
    paid: boolean;
  }[] = [];
  const obdScans: {id: string; vehicleId: string; scanDate: Date; rawData: string}[] = [];
  const obdErrorCodes: {obdScanId: string; code: string; description: string; severity: string}[] =
    [];
  const aiDiagnostics: {id: string; vehicleId: string; prompt: string; aiResponse: string}[] = [];
  const vehicleEvents: {
    id: string;
    vehicleId: string;
    userId: string;
    type: string;
    note: string;
    amount: number | null;
  }[] = [];
  const attachments: {
    userId: string;
    vehicleId: string;
    maintenanceLogId?: string;
    vehicleEventId?: string;
    aiDiagnosticId?: string;
    mediaType: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string | null;
    status: string;
  }[] = [];
  const notifications: {
    userId: string;
    vehicleId: string | null;
    type: string;
    message: string;
    sentAt: Date | null;
    read: boolean;
  }[] = [];

  const vehicleRows = vehicles.map((v, i) => {
    const owner = users[v.owner];
    const vehicleId = randomUUID();
    const ownerId = userIds[v.owner];
    const monthlyKm = KM_PER_MONTH[v.fuel];

    // ~18 honap visszamenoleg, havi tankolas/toltes; a km-allas novekszik
    let mileage = v.startKm;
    const historyStart = addDays(TODAY, -540);
    for (let day = 0; day <= 540; day += randInt(12, 26)) {
      const km = Math.round(monthlyKm * (day === 0 ? 0 : randInt(35, 65) / 100));
      mileage += km;
      const isElectric = v.fuel === 'ELECTRIC';
      const quantity = isElectric ? randInt(30, 70) : randInt(28, 62) + randInt(0, 99) / 100;
      const unitPrice = isElectric ? 1.6 : v.fuel === 'LPG' ? 3.6 : v.fuel === 'DIESEL' ? 7.3 : 7.1; // RON / l vagy kWh
      fuelLogs.push({
        vehicleId,
        date: addDays(historyStart, day),
        mileage,
        quantity,
        unit: isElectric ? 'KWH' : 'LITER',
        cost: Math.round(quantity * unitPrice * 100) / 100,
        fullTank: rand() > 0.2,
      });
    }
    const currentMileage = mileage;

    // 3-5 szervizlatogatas, mindegyikben 1-4 muvelet
    const visitCount = randInt(3, 5);
    for (let s = 0; s < visitCount; s++) {
      const logId = randomUUID();
      const dayOffset = Math.round((540 / visitCount) * s) + randInt(0, 40);
      const serviceDate = addDays(historyStart, dayOffset);
      const mileageAtService =
        v.startKm + Math.round((currentMileage - v.startKm) * (dayOffset / 540));
      const types = new Set<string>(['OIL_CHANGE']);
      const opCount = randInt(1, 4);
      while (types.size < opCount) types.add(pick(OPERATION_TYPES));
      if (v.fuel === 'ELECTRIC') types.delete('OIL_CHANGE');
      if (types.size === 0) types.add('INSPECTION');

      let totalCost = 0;
      for (const type of types) {
        const [min, max] = OPERATION_COSTS[type];
        const cost = roundTo(randInt(min, max), 5);
        totalCost += cost;
        operations.push({
          maintenanceLogId: logId,
          type,
          cost,
          notes: type === 'OTHER' ? 'Ablaktorlo lapat csere' : null,
        });
      }
      maintenanceLogs.push({
        id: logId,
        vehicleId,
        serviceDate,
        mileageAtService,
        totalCost, // = operations.cost osszege (cache mezo)
        notes:
          s === 0
            ? 'Atvetel utani elso szerviz'
            : pick([null, 'Szerzodeses szerviz', 'Gyorsszerviz', 'Ismeros szerelo']),
      });
      if (s === visitCount - 1) {
        attachments.push({
          userId: ownerId,
          vehicleId,
          maintenanceLogId: logId,
          mediaType: 'IMAGE',
          mimeType: 'image/jpeg',
          sizeBytes: randInt(150_000, 2_500_000),
          storageKey: `seed2/maintenance/${logId}.jpg`,
          status: 'UPLOADED',
        });
      }
    }

    // predikciok: km- es/vagy datum-alapu
    predictions.push(
      {
        vehicleId,
        maintenanceType: v.fuel === 'ELECTRIC' ? 'TIRE_ROTATION' : 'OIL_CHANGE',
        predictedDueDate: null,
        predictedDueMileage: roundTo(currentMileage + randInt(1500, 14000), 500),
        status: pick(['PENDING', 'PENDING', 'NOTIFIED']),
      },
      {
        vehicleId,
        maintenanceType: 'INSPECTION',
        predictedDueDate: addDays(TODAY, randInt(-20, 300)),
        predictedDueMileage: null,
        status: pick(['PENDING', 'NOTIFIED', 'DISMISSED']),
      },
      {
        vehicleId,
        maintenanceType: 'BRAKE_SERVICE',
        predictedDueDate: addDays(TODAY, randInt(60, 400)),
        predictedDueMileage: roundTo(currentMileage + randInt(8000, 30000), 1000),
        status: 'PENDING',
      },
      {
        vehicleId,
        maintenanceType: 'FILTER_CHANGE',
        predictedDueDate: addDays(TODAY, -randInt(30, 200)),
        predictedDueMileage: null,
        status: 'COMPLETED',
      },
    );

    // biztositas: tavalyi (lejart) + idei
    for (const year of [2025, 2026]) {
      insurances.push({
        vehicleId,
        provider: pick(INSURERS),
        policyNumber: `S2-${year}-${String(i + 1).padStart(3, '0')}`,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        cost: roundTo(randInt(600, 2500), 5),
      });
    }

    // utado / rovinietta: tavalyi fizetve, idei vegyes, + egy rovid idotartamu
    taxes.push(
      {
        vehicleId,
        category: v.category,
        year: 2025,
        amount: roundTo(randInt(140, 900), 5),
        dueDate: new Date('2025-12-15'),
        paid: true,
      },
      {
        vehicleId,
        category: v.category,
        year: 2026,
        amount: roundTo(randInt(140, 900), 5),
        dueDate: new Date('2026-12-15'),
        paid: rand() > 0.5,
      },
    );
    if (owner.companyIndex !== null) {
      taxes.push({
        vehicleId,
        category: v.category,
        year: 2026,
        amount: roundTo(randInt(30, 150), 5),
        dueDate: new Date('2026-08-10'),
        paid: true,
      });
    }

    // OBD szkennelesek, 0-3 hibakoddal
    const scanCount = randInt(1, 3);
    for (let s = 0; s < scanCount; s++) {
      const scanId = randomUUID();
      const scanDate = addDays(TODAY, -randInt(5, 400));
      const codes = new Set<(typeof OBD_CODES)[number]>();
      const codeCount = randInt(0, 3);
      while (codes.size < codeCount) codes.add(pick(OBD_CODES));
      obdScans.push({
        id: scanId,
        vehicleId,
        scanDate,
        rawData: JSON.stringify({
          rpm: randInt(750, 900),
          coolantTemp: randInt(80, 95),
          dtc: [...codes].map((c) => c.code),
        }),
      });
      for (const c of codes) obdErrorCodes.push({obdScanId: scanId, ...c});
    }

    // AI diagnosztika minden masodik jarmure, kepcsatolmannyal
    if (i % 2 === 0) {
      const diagId = randomUUID();
      aiDiagnostics.push({
        id: diagId,
        vehicleId,
        prompt: `Mit jelent a muszerfalon vilagito sarga motorjelzo egy ${v.make} ${v.model} (${v.engine}) eseten?`,
        aiResponse:
          'A sarga motorjelzo altalaban emisszios hibat jelez. Erdemes OBD2-vel kiolvasni a hibakodot; ' +
          'ha a lampa villog, ne terheld a motort es mielobb keress fel szervizt.',
      });
      attachments.push({
        userId: ownerId,
        vehicleId,
        aiDiagnosticId: diagId,
        mediaType: i % 4 === 0 ? 'VIDEO' : 'IMAGE',
        mimeType: i % 4 === 0 ? 'video/mp4' : 'image/png',
        sizeBytes: i % 4 === 0 ? randInt(5_000_000, 40_000_000) : randInt(200_000, 3_000_000),
        storageKey: `seed2/ai/${diagId}.${i % 4 === 0 ? 'mp4' : 'png'}`,
        status: 'UPLOADED',
      });
    }

    // altalanos esemenyek (parkolas, mosas, olajszint stb.)
    const eventCount = randInt(4, 8);
    for (let e = 0; e < eventCount; e++) {
      const tpl = pick(EVENT_TEMPLATES);
      if (tpl.type === 'regeneration' && v.fuel !== 'DIESEL') continue;
      const eventId = randomUUID();
      vehicleEvents.push({
        id: eventId,
        vehicleId,
        userId: ownerId,
        type: tpl.type,
        note: tpl.note,
        amount: tpl.amount ? randInt(tpl.amount[0], tpl.amount[1]) : null,
      });
      if (tpl.type === 'note') {
        attachments.push({
          userId: ownerId,
          vehicleId,
          vehicleEventId: eventId,
          mediaType: 'VIDEO',
          mimeType: 'video/mp4',
          sizeBytes: randInt(3_000_000, 25_000_000),
          storageKey: `seed2/events/${eventId}.mp4`,
          status: 'UPLOADED',
        });
      }
    }

    // ertesitesek
    notifications.push(
      {
        userId: ownerId,
        vehicleId,
        type: 'MAINTENANCE_DUE',
        message: `${v.make} ${v.model}: kozeledik a kovetkezo karbantartas.`,
        sentAt: addDays(TODAY, -randInt(1, 10)),
        read: rand() > 0.5,
      },
      {
        userId: ownerId,
        vehicleId,
        type: 'WEEKLY_MILEAGE',
        message: `${v.plate}: a heten ${randInt(80, 900)} km-t tettel meg.`,
        sentAt: addDays(TODAY, -randInt(0, 6)),
        read: rand() > 0.3,
      },
      {
        userId: ownerId,
        vehicleId,
        type: 'INSURANCE_EXPIRY',
        message: `${v.plate}: a biztositas 2026-12-31-en lejar.`,
        sentAt: null,
        read: false,
      },
      {
        userId: ownerId,
        vehicleId,
        type: 'TAX_DUE',
        message: `${v.plate}: 2026-os rovinietta esedekes december 15-ig.`,
        sentAt: addDays(TODAY, -randInt(0, 20)),
        read: false,
      },
    );

    return {
      id: vehicleId,
      ownerUserId: ownerId,
      companyId: owner.companyIndex === null ? null : companyIds[owner.companyIndex],
      make: v.make,
      model: v.model,
      year: v.year,
      vin: `SEED2VIN${String(i + 1).padStart(9, '0')}`, // 17 karakter, egyedi
      licensePlate: v.plate,
      engineType: v.engine,
      fuelType: v.fuel,
      currentMileage,
      purchaseDate: new Date(v.bought),
    };
  });

  // OBD_ALERT ertesitesek a kritikus hibakodokhoz
  for (const ec of obdErrorCodes.filter((c) => c.severity === 'CRITICAL')) {
    const scan = obdScans.find((s) => s.id === ec.obdScanId)!;
    const row = vehicleRows.find((r) => r.id === scan.vehicleId)!;
    notifications.push({
      userId: row.ownerUserId,
      vehicleId: row.id,
      type: 'OBD_ALERT',
      message: `${row.licensePlate}: kritikus hibakod (${ec.code}) - ${ec.description}.`,
      sentAt: scan.scanDate,
      read: false,
    });
  }
  // altalanos, jarmuhoz nem kotott ertesites (vehicleId nullable)
  for (const userId of userIds) {
    notifications.push({
      userId,
      vehicleId: null,
      type: 'WEEKLY_MILEAGE',
      message: 'Heti osszesito elkeszult.',
      sentAt: TODAY,
      read: false,
    });
  }

  // Beszuras FK-sorrendben: szulo tablak elobb, gyerekek utana
  await prisma.vehicle.createMany({data: vehicleRows});
  await prisma.maintenanceLog.createMany({data: maintenanceLogs});
  await prisma.maintenanceOperation.createMany({data: operations});
  await prisma.maintenancePrediction.createMany({data: predictions});
  await prisma.fuelLog.createMany({data: fuelLogs});
  await prisma.insurance.createMany({data: insurances});
  await prisma.vehicleTax.createMany({data: taxes});
  await prisma.obdScan.createMany({data: obdScans});
  await prisma.obdErrorCode.createMany({data: obdErrorCodes});
  await prisma.aiDiagnostic.createMany({data: aiDiagnostics});
  await prisma.vehicleEvent.createMany({data: vehicleEvents});
  await prisma.attachment.createMany({data: attachments}); // log/event/ai utan, mert hivatkozik rajuk
  await prisma.notification.createMany({data: notifications});

  console.table({
    Company: companies.length,
    User: users.length,
    RefreshToken: 5,
    Vehicle: vehicleRows.length,
    MaintenanceLog: maintenanceLogs.length,
    MaintenanceOperation: operations.length,
    MaintenancePrediction: predictions.length,
    FuelLog: fuelLogs.length,
    Insurance: insurances.length,
    VehicleTax: taxes.length,
    ObdScan: obdScans.length,
    ObdErrorCode: obdErrorCodes.length,
    AiDiagnostic: aiDiagnostics.length,
    VehicleEvent: vehicleEvents.length,
    Attachment: attachments.length,
    Notification: notifications.length,
  });
  console.log('Seed-2 kesz.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
