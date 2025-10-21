import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

// This 'Catch' tells NestJS that this filter
// should ONLY catch errors of type PrismaClientKnownRequestError
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  // Logger is a good practice to see the error in the server console
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      `Error Code: ${exception.code} | Message: ${exception.message}`,
      exception.stack,
    );

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An internal server error occurred.';
    let details: any = null;

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'The record already exists.';
        details = {
          field: (exception.meta?.target as string[])?.join(', '),
          message: `The field '${(exception.meta?.target as string[])?.join(
            ', ',
          )}' is already in use.`,
        };
        break;

      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'The record you are trying to operate on was not found.';
        break;

      case 'P2003':
        status = HttpStatus.NOT_FOUND;
        message =
          'The operation failed because a related record was not found.';
        details = {
          field: exception.meta?.field_name,
          message: `Foreign key constraint failed on the field: ${exception.meta?.field_name}`,
        };
        break;

      default:
        message = 'A database error occurred.';
        details = {
          prismaCode: exception.code,
        };
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      details: details,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
