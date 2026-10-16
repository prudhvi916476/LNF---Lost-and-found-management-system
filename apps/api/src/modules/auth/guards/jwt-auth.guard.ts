import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization;

    // In development mode, allow dev-token bypass with a valid user context
    if (process.env.NODE_ENV === 'development' && authHeader === 'Bearer dev-token') {
      req.user = {
        id: '3f94e037-fd61-4a65-88a4-6a1315e11d41',
        sub: '3f94e037-fd61-4a65-88a4-6a1315e11d41',
        email: 'prudhvi916476@gmail.com',
        role: 'user',
      };
      return true;
    }

    return super.canActivate(context);
  }
}
