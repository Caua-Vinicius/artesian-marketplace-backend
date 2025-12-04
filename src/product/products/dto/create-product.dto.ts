import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
} from 'class-validator';
import { Exclude, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @Exclude()
  compareAtPrice: number;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  weight?: number;
}
