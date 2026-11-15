import {ClassConstructor, plainToInstance} from 'class-transformer';
import {validate, ValidationError} from 'class-validator';

// Ugyanaz az ellenorzes, amit a globalis ValidationPipe vegez (whitelist +
// transform), de kezzel hivhato: a szinkron push a mutationok data mezojet igy
// validalja, hogy egy hibas sor ne utasitsa el az egesz kerest.
export async function validateDto<T extends object>(
  cls: ClassConstructor<T>,
  plain: object,
): Promise<{value: T} | {error: string}> {
  const value = plainToInstance(cls, plain);
  const errors = await validate(value, {whitelist: true});
  if (errors.length === 0) return {value};
  return {error: collectMessages(errors).join('; ')};
}

function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((e) => [
    ...Object.values(e.constraints ?? {}),
    ...collectMessages(e.children ?? []),
  ]);
}
