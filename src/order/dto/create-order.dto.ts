import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
