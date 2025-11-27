import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'S3_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const region = configService.getOrThrow<string>('AWS_REGION');
        const secretAccessKey = configService.getOrThrow<string>(
          'AWS_ACCESS_KEY_SECRET',
        );
        const accessKeyId = configService.getOrThrow<string>(
          'AWS_ACCESS_KEY_SECRET_ID',
        );
        return new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
    },
    {
      provide: 'S3_BUCKET_NAME_TOKEN',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.getOrThrow<string>('AWS_BUCKET_NAME');
      },
    },
    S3Service,
  ],
  exports: [S3Service, 'S3_CLIENT'],
})
export class S3Module {}
