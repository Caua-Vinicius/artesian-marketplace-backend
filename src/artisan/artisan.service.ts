import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateArtisanDto } from './dto/create-artisan.dto';
import { Artisan, ArtisanStatus, UserRole } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { FullUser } from 'src/user/types/full-user.type';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ArtisanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async createArtisan(
    userId: string,
    createArtisanDto: CreateArtisanDto,
  ): Promise<Artisan> {
    const user: FullUser = await this.userService.getFullUserById(userId);

    if (user.artisanProfile) {
      throw new BadRequestException('This user is already an artisan.');
    }
    if (!user.Address || user.Address.length === 0) {
      throw new BadRequestException(
        'User must have an address to become an artisan.',
      );
    }

    return this.prisma.artisan.create({
      data: {
        ...createArtisanDto,
        status: ArtisanStatus.PENDING,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }

  async getArtisanById(artisanId: string): Promise<Artisan> {
    //todo: create a dto to return only public infos of artisan
    return await this.prisma.artisan.findFirstOrThrow({
      where: {
        id: artisanId,
      },
      include: {
        products: {
          orderBy: {
            avgRating: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async findAllPending(): Promise<Artisan[]> {
    return this.prisma.artisan.findMany({
      where: {
        status: ArtisanStatus.PENDING,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async approveArtisan(artisanId: string, userId: string): Promise<Artisan> {
    return await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          role: UserRole.ARTISAN,
        },
      });

      return await tx.artisan.update({
        where: { id: artisanId },
        data: {
          status: ArtisanStatus.APPROVED,
        },
      });
    });
  }

  async rejectArtisan(artisanId: string): Promise<Artisan> {
    return this.prisma.artisan.update({
      where: { id: artisanId },
      data: {
        status: ArtisanStatus.REJECTED,
      },
    });
  }

  async getArtisanDashboard(artisanId: string) {
    const artisan = await this.prisma.artisan.findUniqueOrThrow({
      where: { id: artisanId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const aggregations = await this.prisma.product.aggregate({
      where: { artisanId: artisanId },
      _avg: { avgRating: true },
      _sum: { reviewCount: true },
    });

    return {
      storeName: artisan.storeName,
      totalProducts: artisan._count.products,
      averageRating: aggregations._avg.avgRating || 0,
      totalReviews: aggregations._sum.reviewCount || 0,
      status: artisan.status,
    };
  }
}
