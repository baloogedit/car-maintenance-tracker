import {INestApplication, ValidationPipe} from '@nestjs/common';
import {HttpAdapterHost} from '@nestjs/core';

import {PrismaExceptionFilter} from '../filters/prisma-exception.filter';

export const API_PREFIX = 'api/v1';

// A main.ts es az e2e tesztek kozos beallitasai, hogy a teszt ugyanazt az
// alkalmazast lassa, mint ami elindul.
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ismeretlen mezo eldobva
      transform: true, // a DTO osztaly peldanya jon (pl. Date a datum stringbol)
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter));
}
