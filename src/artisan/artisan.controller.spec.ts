import { Test, TestingModule } from '@nestjs/testing';
import { ArtisanController } from './artisan.controller';

describe('ArtisanController', () => {
  let controller: ArtisanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtisanController],
    }).compile();

    controller = module.get<ArtisanController>(ArtisanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
