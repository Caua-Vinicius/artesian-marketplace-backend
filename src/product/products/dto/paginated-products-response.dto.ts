import { ProductItemDto } from './product-item.dto';

class PaginationMetaDto {
  nextCursor: string | null;

  hasNextPage: boolean;
}

export class PaginatedProductsResultDto {
  data: ProductItemDto[];

  meta: PaginationMetaDto;
}
