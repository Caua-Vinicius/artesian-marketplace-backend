import { Artisan, User, UserAddress } from '@prisma/client';

export type FullUser = User & {
  Address: UserAddress[];
  artisanProfile: Artisan;
};
