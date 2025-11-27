import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateUserAddressDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  street: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  number: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  complement?: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  state: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  country: string;
}
