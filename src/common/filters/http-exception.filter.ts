import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { status, message } = this.mapPrismaError(exception);
      response.status(status).json({
        statusCode: status,
        message,
        error: 'PrismaError',
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    const message = isHttpException
      ? typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as Record<string, unknown>)?.message ??
          exception.message)
      : 'Internal server error';

    if (!isHttpException) {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: isHttpException ? exception.name : 'InternalServerError',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): { status: number; message: string } {
    switch (error.code) {
      case 'P2002':
        return { status: 409, message: 'A record with this value already exists' };
      case 'P2025':
        return { status: 404, message: 'Record not found' };
      case 'P2003':
        return { status: 400, message: 'Invalid reference — related record does not exist' };
      default:
        return { status: 500, message: 'Database error' };
    }
  }
}