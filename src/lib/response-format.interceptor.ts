import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(
    _: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<any>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
