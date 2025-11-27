import { SetMetadata } from '@nestjs/common';
import { UserRoles } from '../enums/prisma.enum';

export const Roles = (...roles: UserRoles[]) => SetMetadata('roles', roles);
