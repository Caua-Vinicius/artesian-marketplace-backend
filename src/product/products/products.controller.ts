import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ArtisanStatus, Product, User, UserRole } from '@prisma/client';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArtisanStatusGuard } from 'src/common/guards/artisan-status.guard';
import { RequireArtisanStatus } from 'src/common/decorators/artisan-status.decorator';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-product-stock.dto';

@UseGuards(JwtAuthGuard, RolesGuard, ArtisanStatusGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.ARTISAN)
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  @Post()
  async createProduct(
    @GetUser() user: User,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return await this.productsService.createProduct(user.id, createProductDto);
  }

  @Put(':productId/status')
  @Roles(UserRole.ARTISAN)
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  async updateProductStatus(
    @Param('productId') productId: string,
    @GetUser() user: User,
    @Body() updateProductStatusDto: UpdateProductStatusDto,
  ) {
    return await this.productsService.updateProductStatus(
      user.id,
      productId,
      updateProductStatusDto,
    );
  }

  @Put(':productId')
  @Roles(UserRole.ARTISAN)
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  async updateProduct(
    @Param('productId') productId: string,
    @GetUser() user: User,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.updateProduct(
      user.id,
      productId,
      updateProductDto,
    );
  }

  @Get()
  async getProducts(): Promise<Product[]> {
    return await this.productsService.getProducts();
  }

  @Get('my-products')
  @Roles(UserRole.ARTISAN)
  async getMyProducts(@GetUser() user: User): Promise<Product[]> {
    return await this.productsService.getArtisanProducts(user.id);
  }

  @Get(':productId')
  async getProductById(
    @Param('productId') productId: string,
  ): Promise<Product> {
    return await this.productsService.getProductById(productId);
  }

  @Roles(UserRole.ARTISAN)
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  @Post(':productId/images')
  @UseInterceptors(FileInterceptor('file'))
  async addProductImages(
    @Param('productId') productId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), //5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @GetUser() user: User,
  ): Promise<Product> {
    return await this.productsService.uploadProductImage(
      file,
      productId,
      user.id,
    );
  }

  @Put(':productId/stock/increase')
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  async increaseStock(
    @Param('productId') productId: string,
    @Body() dto: UpdateStockDto,
    @GetUser() user: User,
  ) {
    return this.productsService.increaseStock(productId, user.id, dto);
  }

  @Put(':productId/stock/decrease')
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  async decreaseStock(
    @Param('productId') productId: string,
    @Body() dto: UpdateStockDto,
    @GetUser() user: User,
  ) {
    return this.productsService.decreaseStock(productId, user.id, dto);
  }

  @Put(':productId/category/:categoryId')
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  async addCategoryToProduct(
    @Param('productId') productId: string,
    @Param('categoryId') categoryId: string,
    @GetUser() user: User,
  ) {
    return this.productsService.addCategoryToProduct(
      user.id,
      productId,
      categoryId,
    );
  }

  @Delete(':productId/category/:categoryId')
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  async removeCategoryFromProduct(
    @Param('productId') productId: string,
    @Param('categoryId') categoryId: string,
    @GetUser() user: User,
  ) {
    return this.productsService.removeCategoryFromProduct(
      user.id,
      productId,
      categoryId,
    );
  }
}
