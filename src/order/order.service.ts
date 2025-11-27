import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<Order> {
    const { items } = createOrderDto;

    const productIds = items.map((item) => item.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));

      throw new NotFoundException(
        `Products not found: ${missingIds.join(', ')}`,
      );
    }

    let orderTotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product '${product.title}'. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }

      const unitPrice = Number(product.price);
      const subTotal = unitPrice * item.quantity;

      orderTotal += subTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: unitPrice,
      });
    }

    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          totalAmount: orderTotal,
          items: {
            create: orderItemsData,
          },
          customer: { connect: { id: userId } },
          shippingFee: 0, // todo implement in the future shipping options
        },
        include: {
          items: true,
        },
      });

      const updateStockPromises = items.map((item) => {
        return tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      });

      await Promise.all(updateStockPromises);

      return order;
    });
  }

  async findAllMyOrders(userId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: {
        customerId: userId,
      },
      include: {
        items: {
          include: {
            product: { select: { title: true, imageUrls: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllArtisanOrders(userId: string): Promise<Order[]> {
    const artisan = await this.prisma.artisan.findFirstOrThrow({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    return await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            artisanId: artisan.id,
          },
        },
      },
    });
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirstOrThrow({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (order.customerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return order;
  }

  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.findOne(orderId, userId);

    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      const restockPromises = order.items.map((item) => {
        return tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      });

      await Promise.all(restockPromises);

      return updatedOrder;
    });
  }
}
