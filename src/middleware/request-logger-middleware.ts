/* eslint-disable @typescript-eslint/ban-types */
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('request-logger');

  public use(req: Request, res: Response, next: Function) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} +${duration}ms`,
      );
    });
    next();
  }
}
