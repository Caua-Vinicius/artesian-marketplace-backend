import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User, UserAddress, UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/address')
  async createUserAddress(
    @Body() createUserAddressDto: CreateUserAddressDto,
    @GetUser() user: User,
  ): Promise<User> {
    return await this.userService.addUserAddress(user.id, createUserAddressDto);
  }

  @Get('/address')
  async getUserAddresses(@GetUser() user: User): Promise<UserAddress[]> {
    return await this.userService.getUserAddresses(user.id);
  }

  @Get('me')
  async getFullUser(@GetUser() user: User) {
    return await this.userService.getFullUserById(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('all')
  async getUsers(): Promise<User[]> {
    return await this.userService.getUsers();
  }
}
