import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ArtisanService } from './artisan.service';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { CreateArtisanDto } from './dto/create-artisan.dto';
import { Artisan, ArtisanStatus, User, UserRole } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateArtisanDto } from './dto/update-artisan.dto';
import { ArtisanStatusGuard } from 'src/common/guards/artisan-status.guard';
import { RequireArtisanStatus } from 'src/common/decorators/artisan-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, ArtisanStatusGuard)
@Controller('artisan')
export class ArtisanController {
  constructor(private readonly artisanService: ArtisanService) {}

  @Roles(UserRole.CUSTOMER)
  @Post('apply')
  async createAnArtisanRequest(
    @Body() createArtisanDto: CreateArtisanDto,
    @GetUser() user: User,
  ): Promise<Artisan> {
    return await this.artisanService.createArtisan(user.id, createArtisanDto);
  }

  @Get(':artisanId')
  @Public()
  async getArtisanProfile(
    @Param('artisanId') artisanId: string,
  ): Promise<Artisan> {
    return await this.artisanService.getArtisanById(artisanId);
  }

  @Get(':artisanId/dashboard')
  @Public()
  async getArtisanDashboard(@Param('artisanId') artisanId: string) {
    return await this.artisanService.getArtisanDashboard(artisanId);
  }

  @Roles(UserRole.ARTISAN)
  @RequireArtisanStatus(ArtisanStatus.APPROVED)
  @Put(':artisanId')
  async updateArtisanProfile(
    @Param('artisanId') artisanId: string,
    @Body() updateArtisanDto: UpdateArtisanDto,
    @GetUser() user: User,
  ): Promise<Artisan> {
    return await this.artisanService.updateArtisan(
      artisanId,
      user.id,
      updateArtisanDto,
    );
  }
}
