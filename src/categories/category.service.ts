import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BrandService } from 'src/brands/brand.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: BrandService,
  ) {}

  findAll() {
    return this.prisma.category.findMany();
  }

  async save() {
    const response = await this.brandService.findAll();
    const uniqueArray = Array.from(
      new Set(
        response.map(({ brandNm, corpNm, ...rest }) => JSON.stringify(rest)),
      ),
    ).map((item: any) => JSON.parse(item));

    const result = await this.prisma.category.createMany({
      data: uniqueArray,
      skipDuplicates: true,
    });
    return result;
  }
}
