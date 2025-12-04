import { ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

class CategoryResponseDto {
  id: string;

  name: string;
}

export class ProductItemDto {
  id: string;

  title: string;

  description: string;

  price: Decimal | number;

  compareAtPrice: Decimal | number | null;

  weight: number | null;

  material: string | null;

  stock: number;

  status: ProductStatus;

  imageUrls: string[];

  avgRating: Decimal | number;

  reviewCount: number;

  createdAt: Date;

  updatedAt: Date;

  categories: CategoryResponseDto[];
}
