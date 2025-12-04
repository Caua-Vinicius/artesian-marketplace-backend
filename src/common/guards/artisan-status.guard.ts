import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { ARTISAN_STATUS_KEY } from '../decorators/artisan-status.decorator';

@Injectable()
export class ArtisanStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredStatuses = this.reflector.getAllAndOverride<string[]>(
      ARTISAN_STATUS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredStatuses) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not identified');
    }

    const artisan = await this.prisma.artisan.findFirst({
      where: { userId: userId },
      select: { status: true },
    });

    if (!artisan) {
      throw new ForbiddenException('The user is not an artisan!');
    }

    const hasAllowedStatus = requiredStatuses.includes(artisan.status);

    if (!hasAllowedStatus) {
      throw new ForbiddenException(
        `Your artisan status (${artisan.status}) do not allow you to do this action.`,
      );
    }

    return true;
  }
}
