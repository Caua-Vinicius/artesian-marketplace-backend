import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { FullUser } from './types/full-user.type';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async addUserAddress(
    userId: string,
    createUserAdressDto: CreateUserAddressDto,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        Address: { create: { ...createUserAdressDto } },
      },
      include: { Address: true },
    });
  }

  async getFullUserById(userId: string): Promise<FullUser> {
    return this.prisma.user.findFirstOrThrow({
      where: { id: userId },
      include: {
        Address: true,
        artisanProfile: true,
      },
    });
  }

  async getUsers(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }
}
