import { Test, TestingModule } from '@nestjs/testing';
import { ArtisanService } from './artisan.service';

describe('ArtisanService', () => {
  let service: ArtisanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtisanService],
    }).compile();

    service = module.get<ArtisanService>(ArtisanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
