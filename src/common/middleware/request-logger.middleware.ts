import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const startTime = Date.now();

    // Cloudflare yoki Proxy orqali kelayotgan foydalanuvchining REAL IP-manzilini olish
    const clientIp = headers['cf-connecting-ip'] || headers['x-forwarded-for'] || ip;

    // Authorization header'idan JWT tokenni ajratib olish va foydalanuvchi ID-sini ko'rish
    let userId = 'GUEST';
    if (headers.authorization && typeof headers.authorization === 'string' && headers.authorization.startsWith('Bearer ')) {
      try {
        const token = headers.authorization.split(' ')[1];
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.sub) {
          userId = `User#${decoded.sub}`;
        } else if (decoded && decoded.id) {
          userId = `User#${decoded.id}`;
        }
      } catch (err) {
        userId = 'INVALID_TOKEN';
      }
    }

    // Javob qaytganda log chiqarish
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `[${method}] ${originalUrl} ${statusCode} - ${responseTime}ms - IP: ${clientIp} - ${userId}`
      );
    });

    next();
  }
}
