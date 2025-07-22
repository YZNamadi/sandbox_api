import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const url = req.url;
    const originalUrl = req.originalUrl;
    if (
      url.includes('/auth/signup') || url.includes('/auth/login') ||
      (originalUrl && (originalUrl.includes('/auth/signup') || originalUrl.includes('/auth/login')))
    ) {
      return true;
    }
    return super.canActivate(context);
  }
} 