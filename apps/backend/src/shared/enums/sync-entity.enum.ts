// A /sync vegpontokon atvitt tablak. Az ertek a valaszban a changes kulcsa is.
// Uj szinkronizalt tabla (pl. FuelLog) = uj ertek itt + egy uj handler
// (lasd sync/handlers/) + a SYNC_ENTITY_ORDER bovitese.
export enum SyncEntity {
  Vehicle = 'Vehicle',
}
