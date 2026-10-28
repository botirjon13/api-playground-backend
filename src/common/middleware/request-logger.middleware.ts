import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable Polyfill
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl, headers } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // IP-manzilni olish (Cloudflare orqali kelayotgan bo'lsa real IP-ni olish)
    const clientIp = headers['cf-connecting-ip'] || headers['x-forwarded-for'] || ip;

    // JWT Tokendan Foydalanuvchi ID-sini ajratib olish
    let userId = 'GUEST'; // Agar tizimga kirmagan bo'lsa
    if (headers.authorization && headers.authorization.startsWith('Bearer ')) {
      try {
        const token = headers.authorization.split(' ')[1];
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.sub) {
          userId = `User#${decoded.sub}`; // Masalan: User#12
        } else if (decoded && decoded.id) {
          userId = `User#${decoded.id}`;
        }
      } catch (err) {
        userId = 'INVALID_TOKEN';
      }
    }

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // To'liq va batafsil log chiqarish
      this.logger.log(
        `[${method}] ${originalUrl} ${statusCode} - ${responseTime}ms - IP: ${clientIp} - ${userId}`
      );
    });

    next();
  }
}
