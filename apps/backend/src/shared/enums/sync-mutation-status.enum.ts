// Egy push mutation eredmenye (lasd az API es szinkronizacios tervet).
export enum SyncMutationStatus {
  APPLIED = 'APPLIED', // elfogadva, uj version
  DUPLICATE = 'DUPLICATE', // ezt a mutationId-t mar feldolgoztuk; az eredeti eredmeny jon vissza
  REJECTED_STALE = 'REJECTED_STALE', // a szerver peldanya ujabb (LWW) vagy a sor torolt; current = a szerver peldanya
  REJECTED_INVALID = 'REJECTED_INVALID', // validacios vagy jogosultsagi hiba (error mezo)
  DEFERRED = 'DEFERRED', // a szulo meg nincs a szerveren, a kovetkezo korben ujra
}
