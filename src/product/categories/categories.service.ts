import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async updateCategory(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.prisma.category.update({
      where: { id: categoryId },
      data: updateCategoryDto,
    });
  }

  async findCategories(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  async findCategoryById(categoryId: string): Promise<Category> {
    return await this.prisma.category.findFirstOrThrow({
      where: { id: categoryId },
    });
  }

  async deleteCategory(categoryId: string): Promise<Category> {
    return this.prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
