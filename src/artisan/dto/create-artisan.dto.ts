import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsUrl,
} from 'class-validator';

export class CreateArtisanDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  storeName: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  storeDescription?: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  identification: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'proofOfAddressUrl must be a valid URL' })
  proofOfAddressUrl: string;
}
