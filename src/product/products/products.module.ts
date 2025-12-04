import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FILE_PREFIX',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.getOrThrow<string>('FILE_PREFIX');
      },
    },
    ProductsService,
    PrismaService,
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
