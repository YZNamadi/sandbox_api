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
    const params = (req.params as { sandboxId?: string }) || {};
    const body = (req.body as { sandboxId?: string }) || {};
    const query = (req.query as { sandboxId?: string }) || {};
    const sandboxId: string | undefined =
      params.sandboxId || body.sandboxId || query.sandboxId;
    const route: string = (req.route as { path: string })?.path || req.url;
    const method: string = req.method;
    const requestBody: unknown = req.body;

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        try {
          void this.logRepo.save(
            this.logRepo.create({
              ...(sandboxId ? { sandbox: { id: sandboxId } } : {}),
              user: user && user.userId ? { id: user.userId } : undefined,
              route,
              method,
              responseCode: req.res?.statusCode,
              requestBody,
              responseBody,
            }),
          );
        } catch {
          // fail silently for logging
        }
      }),
      catchError((err: unknown) => throwError(() => err)),
    );
  }
}
