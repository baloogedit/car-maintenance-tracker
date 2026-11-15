import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';

import {NOT_DELETED} from '../../shared/constants/soft-delete.constants';
import {PrismaService} from '../../shared/modules/db/prisma.service';

export interface SoftDeleteOptions {
  // ha mar egy tranzakcioban vagyunk (szinkron push), abban fut; kulonben sajat tranzakcio
  tx?: Prisma.TransactionClient;
  // a tombstone ideje (clientUpdatedAt es deletedAt); alapbol most
  at?: Date;
  // a torlest kero eszkoz (szinkron push), a lastModifiedByDeviceId-ba kerul
  deviceId?: string;
}

// Soft delete kaszkaddal: a jarmu es minden hozza tartozo bejegyzes deletedAt
// erteket kap (egy tranzakcioban), igy a torles a szinkronnal minden eszkozre
// eljut. A mar korabban torolt sorok eredeti torlesi ideje megmarad.
//
// Kulon service, mert a REST DELETE es a szinkron push DELETE is ezt hivja. Ha uj,
// jarmuhoz kotott tabla kerul a semaba, itt kell felvenni.
@Injectable()
export class VehicleDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async softDeleteWithEntries(vehicleId: string, options: SoftDeleteOptions = {}): Promise<void> {
    if (options.tx) {
      await this.run(options.tx, vehicleId, options);
      return;
    }
    await this.prisma.$transaction((tx) => this.run(tx, vehicleId, options));
  }

  private async run(
    tx: Prisma.TransactionClient,
    vehicleId: string,
    {at, deviceId}: SoftDeleteOptions,
  ): Promise<void> {
    const now = at ?? new Date();
    const tombstone = {
      deletedAt: now,
      clientUpdatedAt: now,
      ...(deviceId ? {lastModifiedByDeviceId: deviceId} : {}),
    };
    const byVehicle = {vehicleId, ...NOT_DELETED};

    await tx.maintenanceOperation.updateMany({
      where: {maintenanceLog: {vehicleId}, ...NOT_DELETED},
      data: tombstone,
    });
    await tx.obdErrorCode.updateMany({
      where: {obdScan: {vehicleId}, ...NOT_DELETED},
      data: tombstone,
    });
    // a csatolmanynak nincs vehicleId-ja: a szulojen (log/esemeny/AI) at tartozik a jarmuhoz
    await tx.attachment.updateMany({
      where: {
        ...NOT_DELETED,
        OR: [
          {maintenanceLog: {vehicleId}},
          {vehicleEvent: {vehicleId}},
          {aiDiagnostic: {vehicleId}},
        ],
      },
      data: tombstone,
    });
    await tx.maintenanceLog.updateMany({where: byVehicle, data: tombstone});
    await tx.maintenancePrediction.updateMany({where: byVehicle, data: tombstone});
    await tx.fuelLog.updateMany({where: byVehicle, data: tombstone});
    await tx.insurance.updateMany({where: byVehicle, data: tombstone});
    await tx.vehicleTax.updateMany({where: byVehicle, data: tombstone});
    await tx.obdScan.updateMany({where: byVehicle, data: tombstone});
    await tx.aiDiagnostic.updateMany({where: byVehicle, data: tombstone});
    await tx.vehicleEvent.updateMany({where: byVehicle, data: tombstone});
    await tx.notification.updateMany({where: byVehicle, data: tombstone});
    await tx.vehicle.update({where: {id: vehicleId}, data: tombstone});
  }
}
