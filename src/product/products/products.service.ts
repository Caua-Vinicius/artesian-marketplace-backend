import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from '@prisma/client';
import { UpdateStockDto } from './dto/update-product-stock.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { S3Service } from 'src/s3/s3.service';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    @Inject('FILE_PREFIX') private readonly filePrefix: string,
  ) {}

  async createProduct(
    userId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const { categoryId, ...createProductInput } = createProductDto;
    const artisan = await this.prisma.artisan.findFirstOrThrow({
      where: {
        userId,
      },
    });

    const category = await this.prisma.category.findFirstOrThrow({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new BadRequestException('This Category does not exist');
    }

    return await this.prisma.product.create({
      data: {
        ...createProductInput,
        categories: {
          create: {
            category: {
              connect: {
                id: categoryId,
              },
            },
          },
        },
        artisan: {
          connect: {
            id: artisan.id,
          },
        },
        compareAtPrice: createProductDto.price,
        description: createProductDto.description
          ? createProductDto.description
          : '',
      },
    });
  }

  async isUserArtisanOwnerOfTheProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const artisan = await this.prisma.artisan.findFirstOrThrow({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    const product = await this.prisma.product.findFirstOrThrow({
      where: {
        id: productId,
      },
      select: {
        artisanId: true,
      },
    });

    return artisan.id === product.artisanId;
  }

  async updateProductStatus(
    userId: string,
    productId: string,
    updateProductStatusDto: UpdateProductStatusDto,
  ): Promise<Product> {
    const { status } = updateProductStatusDto;
    const isUserArtisanOwnerOfTheProduct =
      await this.isUserArtisanOwnerOfTheProduct(userId, productId);

    if (!isUserArtisanOwnerOfTheProduct)
      throw new ForbiddenException(
        'This artisan is not the owner of this product',
      );

    return await this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        status,
      },
    });
  }

  async getProducts(): Promise<Product[]> {
    return await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
    });
  }

  async getProductById(productId: string): Promise<Product> {
    return await this.prisma.product.findFirstOrThrow({
      where: {
        id: productId,
      },
      include: {
        artisan: true,
        categories: true,
        reviews: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // just a preview of recent reviews
        },
      },
    });
  }

  async updateProduct(
    userId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const isUserArtisanOwnerOfTheProduct =
      await this.isUserArtisanOwnerOfTheProduct(userId, productId);

    if (!isUserArtisanOwnerOfTheProduct)
      throw new ForbiddenException(
        'This artisan is not the owner of this product',
      );

    return await this.prisma.product.update({
      where: {
        id: productId,
      },
      data: updateProductDto,
    });
  }

  async increaseStock(productId: string, userId: string, dto: UpdateStockDto) {
    const { quantity } = dto;

    await this.prisma.product.findFirstOrThrow({
      where: { id: productId },
      select: { id: true }, // optimization: select only ID
    });

    const isUserArtisanOwnerOfTheProduct =
      await this.isUserArtisanOwnerOfTheProduct(userId, productId);

    if (!isUserArtisanOwnerOfTheProduct)
      throw new ForbiddenException(
        'This artisan is not the owner of this product',
      );

    return await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }

  async decreaseStock(productId: string, userId: string, dto: UpdateStockDto) {
    const { quantity } = dto;

    const isUserArtisanOwnerOfTheProduct =
      await this.isUserArtisanOwnerOfTheProduct(userId, productId);

    if (!isUserArtisanOwnerOfTheProduct)
      throw new ForbiddenException(
        'This artisan is not the owner of this product',
      );

    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirstOrThrow({
        where: { id: productId },
      });

      if (product.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      return updatedProduct;
    });
  }

  async uploadProductImage(
    file: Express.Multer.File,
    productId: string,
    userId: string,
  ): Promise<Product> {
    const isUserArtisanOwnerOfTheProduct =
      await this.isUserArtisanOwnerOfTheProduct(userId, productId);

    if (!isUserArtisanOwnerOfTheProduct)
      throw new ForbiddenException(
        'This artisan is not the owner of this product',
      );

    const product = await this.prisma.product.findFirstOrThrow({
      where: {
        id: productId,
      },
    });

    const fileExt = extname(file.originalname);
    const s3fileName = `${this.filePrefix}/product-${product.id}/${uuidv4()}${fileExt}`;

    const fileUrl = await this.s3Service.uploadFile(file, s3fileName);

    return await this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        imageUrls: {
          push: fileUrl,
        },
      },
    });
  }

  async getArtisanProducts(userId: string): Promise<Product[]> {
    const artisan = await this.prisma.artisan.findFirstOrThrow({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });
    const products = await this.prisma.product.findMany({
      where: {
        artisanId: artisan.id,
      },
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return products.map((product) => ({
      ...product,
      categories: product.categories.map((c) => c.category),
    }));
  }

  async addCategoryToProduct(
    userId: string,
    productId: string,
    categoryId: string,
  ): Promise<Product> {
    const isUserArtisanOwnerOfTheProduct =
      await this.isUserArtisanOwnerOfTheProduct(userId, productId);

    if (!isUserArtisanOwnerOfTheProduct)
      throw new ForbiddenException(
        'This artisan is not the owner of this product',
      );

    return await this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        categories: {
          create: {
            category: {
              connect: {
                id: categoryId,
              },
            },
          },
        },
      },
      include: {
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async removeCategoryFromProduct(
    userId: string,
    productId: string,
    categoryId: string,
  ) {
    const isUserArtisanOwnerOfTheProduct =
      await this.isUserArtisanOwnerOfTheProduct(userId, productId);

    if (!isUserArtisanOwnerOfTheProduct)
      throw new ForbiddenException(
        'This artisan is not the owner of this product',
      );

    return await this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        categories: {
          delete: {
            productId_categoryId: {
              productId,
              categoryId,
            },
          },
        },
      },
    });
  }
}
