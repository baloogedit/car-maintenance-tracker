// Egy push mutation muvelete: UPSERT = letrehozas vagy teljes sor felulirasa,
// DELETE = tombstone (soft delete).
export enum SyncOperation {
  UPSERT = 'UPSERT',
  DELETE = 'DELETE',
}
