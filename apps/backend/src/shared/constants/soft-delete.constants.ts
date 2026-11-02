// Soft delete: a szinkronizalt tablakban torleskor csak a deletedAt toltodik ki.
// A REST lekerdezesekben ezert mindig szerepeljen ez a feltetel. A szinkron pull
// szandekosan latja a torolt sorokat is (tombstone), ezert nem rejtjuk el oket
// automatikusan a Prisma kliens szintjen.
export const NOT_DELETED = {deletedAt: null};
