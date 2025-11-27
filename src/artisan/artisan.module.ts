import { Module } from '@nestjs/common';
import { ArtisanController } from './artisan.controller';
import { ArtisanService } from './artisan.service';
import { UserModule } from 'src/user/user.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [UserModule],
  controllers: [ArtisanController],
  providers: [ArtisanService, PrismaService],
})
export class ArtisanModule {}
