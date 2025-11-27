import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ArtisanService } from './artisan.service';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { CreateArtisanDto } from './dto/create-artisan.dto';
import { Artisan, User, UserRole } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
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
  async getArtisanProfile(
    @Param('artisanId') artisanId: string,
  ): Promise<Artisan> {
    return await this.artisanService.getArtisanById(artisanId);
  }

  @Get(':artisanId/dashboard')
  async getArtisanDashboard(@Param('artisanId') artisanId: string) {
    return await this.artisanService.getArtisanDashboard(artisanId);
  }
}
