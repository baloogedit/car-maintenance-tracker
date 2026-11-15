// A REJECTED_INVALID eredmeny error.code ertekei.
export enum SyncErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED', // hibas data
  NOT_FOUND = 'NOT_FOUND', // a sor letezik, de a felhasznalo nem latja (nem araljuk el, hogy letezik)
  FORBIDDEN = 'FORBIDDEN', // latja, de nem szerkesztheti
  CONFLICT = 'CONFLICT', // egyedi ertek utkozes (pl. foglalt VIN)
  MUTATION_ID_CONFLICT = 'MUTATION_ID_CONFLICT', // a mutationId-t mas felhasznalo mar hasznalta
}
