// A ceg modul allandoi egy helyen.
export const COMPANY_NAME_MAX_LENGTH = 100;
export const TAX_ID_MAX_LENGTH = 32;

// Csatlakozasi kod: 8 karakter, a konnyen osszetevesztheto jelek (0/O, 1/I/L)
// nelkul, hogy telefonon is konnyu legyen bediktalni.
export const JOIN_CODE_LENGTH = 8;
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_MAX_LENGTH = 16;
// Ennyiszer probalunk uj kodot generalni, ha (nagyon ritkan) mar foglalt.
export const JOIN_CODE_MAX_ATTEMPTS = 3;
