import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const { method, originalUrl, ip } = request;

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      this.logger.log(`${method} ${originalUrl} ${response.statusCode} - ${duration}ms - ${ip}`);
    });

    next();
  }
}
