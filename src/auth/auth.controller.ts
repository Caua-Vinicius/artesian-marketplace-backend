import { Body, Controller, Post, Get } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { SafeUser } from './types/safe-user.type';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<SafeUser> {
    return await this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.login(loginUserDto);
  }

  @Get('me')
  async getUserInfo(@GetUser() user: User) {
    return user;
  }
}
