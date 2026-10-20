import {PrismaClient} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  // Torles a FK-k miatt fontos sorrendben (a NoAction kapcsolatok miatt)
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.vehicleEvent.deleteMany();
  await prisma.vehicle.deleteMany(); // a tobbi gyerektabla cascade-del torlodik
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash('Teszt1234!', 10);

  const company = await prisma.company.create({
    data: {name: 'Teszt Fuvar Kft.', taxId: '12345678-2-41'},
  });

  const privateUser = await prisma.user.create({
    data: {
      email: 'magan@teszt.hu',
      passwordHash,
      firstName: 'Anna',
      lastName: 'Kiss',
      role: 'PRIVATE',
    },
  });

  const companyAdmin = await prisma.user.create({
    data: {
      email: 'ceg@teszt.hu',
      passwordHash,
      firstName: 'Bela',
      lastName: 'Nagy',
      role: 'COMPANY_ADMIN',
      companyId: company.id,
    },
  });

  const golf = await prisma.vehicle.create({
    data: {
      ownerUserId: privateUser.id,
      make: 'Volkswagen',
      model: 'Golf',
      year: 2016,
      vin: 'WVWZZZAUZGW000001',
      licensePlate: 'ABC-123',
      engineType: '1.6 TDI',
      fuelType: 'DIESEL',
      currentMileage: 182000,
      purchaseDate: new Date('2019-05-10'),
    },
  });

  const transit = await prisma.vehicle.create({
    data: {
      ownerUserId: companyAdmin.id,
      companyId: company.id,
      make: 'Ford',
      model: 'Transit',
      year: 2020,
      vin: 'WF0XXXTTGXKA00002',
      licensePlate: 'XYZ-789',
      fuelType: 'DIESEL',
      currentMileage: 95000,
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: golf.id,
      serviceDate: new Date('2026-03-15'),
      mileageAtService: 175000,
      totalCost: 98500,
      notes: 'Eves szerviz',
      operations: {
        create: [
          {type: 'OIL_CHANGE', cost: 42000},
          {type: 'FILTER_CHANGE', cost: 18500},
          {type: 'BRAKE_SERVICE', cost: 38000, notes: 'Elso fekbetet'},
        ],
      },
    },
  });

  await prisma.maintenancePrediction.create({
    data: {
      vehicleId: golf.id,
      maintenanceType: 'OIL_CHANGE',
      predictedDueMileage: 190000,
      predictedDueDate: new Date('2027-03-15'),
    },
  });

  await prisma.fuelLog.createMany({
    data: [
      {
        vehicleId: golf.id,
        date: new Date('2026-09-01'),
        mileage: 180500,
        quantity: 45.2,
        cost: 28500,
      },
      {
        vehicleId: golf.id,
        date: new Date('2026-09-20'),
        mileage: 181300,
        quantity: 38.7,
        cost: 24400,
      },
    ],
  });

  await prisma.insurance.create({
    data: {
      vehicleId: golf.id,
      provider: 'Teszt Biztosito Zrt.',
      policyNumber: 'POL-2026-001',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      cost: 145000,
    },
  });

  await prisma.vehicleTax.create({
    data: {
      vehicleId: transit.id,
      category: 'CATEGORY_B',
      year: 2026,
      amount: 18000,
      dueDate: new Date('2026-12-15'),
    },
  });

  await prisma.obdScan.create({
    data: {
      vehicleId: golf.id,
      errorCodes: {
        create: [
          {code: 'P0299', description: 'Turbo alultoltes', severity: 'WARNING'},
          {code: 'P0420', description: 'Katalizator hatasfok', severity: 'INFO'},
        ],
      },
    },
  });

  await prisma.vehicleEvent.create({
    data: {
      vehicleId: golf.id,
      userId: privateUser.id,
      type: 'parking',
      note: 'Belvarosi parkolo',
      amount: 1800,
    },
  });

  await prisma.notification.create({
    data: {
      userId: privateUser.id,
      vehicleId: golf.id,
      type: 'MAINTENANCE_DUE',
      message: 'Kozeledik az olajcsere (190 000 km).',
    },
  });

  console.log('Seed kesz.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
