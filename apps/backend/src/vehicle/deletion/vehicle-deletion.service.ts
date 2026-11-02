import {Injectable} from '@nestjs/common';

import {NOT_DELETED} from '../../shared/constants/soft-delete.constants';
import {PrismaService} from '../../shared/modules/db/prisma.service';

// Soft delete kaszkaddal: a jarmu es minden hozza tartozo bejegyzes deletedAt
// erteket kap (egy tranzakcioban), igy a torles a szinkronnal minden eszkozre
// eljut. A mar korabban torolt sorok eredeti torlesi ideje megmarad.
//
// Kulon service, mert a szinkron (push DELETE) is ezt hivja majd. Ha uj, jarmuhoz
// kotott tabla kerul a semaba, itt kell felvenni.
@Injectable()
export class VehicleDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async softDeleteWithEntries(vehicleId: string): Promise<void> {
    const now = new Date();
    const tombstone = {deletedAt: now, clientUpdatedAt: now};
    const byVehicle = {vehicleId, ...NOT_DELETED};

    await this.prisma.$transaction([
      this.prisma.maintenanceOperation.updateMany({
        where: {maintenanceLog: {vehicleId}, ...NOT_DELETED},
        data: tombstone,
      }),
      this.prisma.obdErrorCode.updateMany({
        where: {obdScan: {vehicleId}, ...NOT_DELETED},
        data: tombstone,
      }),
      this.prisma.maintenanceLog.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.maintenancePrediction.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.fuelLog.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.insurance.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.vehicleTax.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.obdScan.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.aiDiagnostic.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.attachment.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.vehicleEvent.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.notification.updateMany({where: byVehicle, data: tombstone}),
      this.prisma.vehicle.update({where: {id: vehicleId}, data: tombstone}),
    ]);
  }
}
