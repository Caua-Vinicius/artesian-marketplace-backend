import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { OrderService } from './order.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { User, UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // --- CLIENT ROUTES ---

  @Post()
  async create(@GetUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto, user.id);
  }

  @Get()
  async findAllMyOrders(@GetUser() user: User) {
    return this.orderService.findAllMyOrders(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.orderService.findOne(id, user.id);
  }

  @Put(':id/cancel')
  async cancelOrder(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.orderService.cancelOrder(id, userId);
  }

  // --- ADMIN ROUTES ---

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto.status);
  }
}
