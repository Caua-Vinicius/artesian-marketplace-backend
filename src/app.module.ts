import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ArtisanModule } from './artisan/artisan.module';
import { UserModule } from './user/user.module';
import { CategoriesModule } from './product/categories/categories.module';
import { ProductsModule } from './product/products/products.module';
import { S3Module } from './s3/s3.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    AuthModule,
    ArtisanModule,
    UserModule,
    CategoriesModule,
    ProductsModule,
    S3Module,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
