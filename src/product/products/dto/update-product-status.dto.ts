import { ProductStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateProductStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(ProductStatus, {
    message: `Status must be one of the following values: ${Object.keys(ProductStatus).join(', ')}`,
  })
  status: ProductStatus;
}
