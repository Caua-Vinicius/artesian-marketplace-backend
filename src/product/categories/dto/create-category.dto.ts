import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @MaxLength(50)
  @IsNotEmpty()
  @IsString()
  name: string;
}
