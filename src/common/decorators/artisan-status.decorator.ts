import { SetMetadata } from '@nestjs/common';

export const ARTISAN_STATUS_KEY = 'artisanStatus';

export const RequireArtisanStatus = (...statuses: string[]) =>
  SetMetadata(ARTISAN_STATUS_KEY, statuses);
