import { SetMetadata } from '@nestjs/common';
import { Profile } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Profile[]) => SetMetadata(ROLES_KEY, roles);
