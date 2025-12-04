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
      select: {
        id: true,
        price: true,
        title: true,
        stock: true,
        artisanId: true,
      },
    });

    if (products.length !== items.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Produtos não encontrados: ${missingIds.join(', ')}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let orderTotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para '${product.title}'. Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
        );
      }

      const unitPrice = Number(product.price);
      const subTotal = unitPrice * item.quantity;

      orderTotal += subTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        artisanId: product.artisanId,
      });
    }

    const userAddress = await this.prisma.userAddress.findUnique({
      where: { id: createOrderDto.userAddressId },
    });

    if (!userAddress) {
      throw new NotFoundException('Endereço não encontrado.');
    }

    if (userAddress.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para usar este endereço.',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
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

      // 2. Cria o Pedido
      const order = await tx.order.create({
        data: {
          totalAmount: orderTotal,
          customerId: userId, // Sintaxe mais curta que connect: { id: userId }
          shippingFee: 0,
          status: 'AWAITING_PAYMENT', // Boa prática definir explícito, mesmo tendo default
          items: {
            create: orderItemsData,
          },
          shippingAddress: {
            create: {
              street: userAddress.street,
              city: userAddress.city,
              state: userAddress.state,
              zipCode: userAddress.zipCode,
              country: userAddress.country,
              number: userAddress.number,
              complement: userAddress.complement,
            },
          },
        },
        include: {
          items: true,
        },
      });

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
    const artisan = await this.prisma.artisan.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!artisan) {
      return [];
    }

    return await this.prisma.order.findMany({
      where: {
        items: {
          some: { artisanId: artisan.id },
        },
      },
      include: {
        items: {
          where: { artisanId: artisan.id },
          include: {
            product: { select: { title: true, imageUrls: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Opcional: ordenar por data
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
