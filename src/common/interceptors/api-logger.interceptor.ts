import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class ApiLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API-MONITORING');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, headers } = request;
    // Client IP manzilini olish
    const ip = request.ip || headers['x-forwarded-for'] || request.socket.remoteAddress;
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        const delay = Date.now() - startTime;

        // Film epizodidagi kabi so'rovlarni kuzatish va konsolga chiqarish
        this.logger.log(
          `[SO'ROV KELD] IP: ${ip} | Metod: ${method} | URL: ${originalUrl} | Status: ${statusCode} | Vaqt: ${delay}ms | Client: ${userAgent}`,
        );
      }),
    );
  }
}
