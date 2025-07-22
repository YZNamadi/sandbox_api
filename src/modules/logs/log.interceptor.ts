import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './log.entity';
import { Request, Response } from 'express';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Log) private readonly logRepo: Repository<Log>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as { userId?: string } | undefined;
    const params = req.params || {};
    const body = req.body || {};
    const query = req.query || {};
    const sandboxId: string | undefined = params.sandboxId || body.sandboxId || query.sandboxId;
    const route: string = req.route?.path || req.url;
    const method: string = req.method;
    const requestBody: unknown = req.body;

    return next.handle().pipe(
      tap(async (responseBody: unknown) => {
        try {
          await this.logRepo.save(
            this.logRepo.create({
              ...(sandboxId ? { sandbox: { id: sandboxId } } : {}),
              user: user && user.userId ? { id: user.userId } : undefined,
              route,
              method,
              responseCode: req.res?.statusCode,
              requestBody,
              responseBody,
            })
          );
        } catch (e) {
          // fail silently for logging
        }
      }),
      catchError(err => throwError(() => err))
    );
  }
} 