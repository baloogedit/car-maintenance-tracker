import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import {BaseExceptionFilter} from '@nestjs/core';
import {Prisma} from '@prisma/client';

// A gyakori Prisma hibakat HTTP valaszra forditja, hogy ne 500 legyen belole:
//   P2002 egyedi kulcs utkozes (pl. foglalt e-mail vagy VIN) -> 409
//   P2025 a modositando/torlendo sor nem letezik              -> 404
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2002') {
      return super.catch(new ConflictException('Ez az ertek mar foglalt.'), host);
    }
    if (exception.code === 'P2025') {
      return super.catch(new NotFoundException(), host);
    }
    return super.catch(exception, host);
  }
}
