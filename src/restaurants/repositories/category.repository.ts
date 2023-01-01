import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly category: Repository<Category>,
  ) {}

  async getOrCreate(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.category.findOne({
      where: { slug: categorySlug },
    });
    if (!category) {
      category = await this.category.save(
        this.category.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }
}
