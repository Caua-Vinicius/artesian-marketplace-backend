import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateArtisanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storeDescription?: string;
}
