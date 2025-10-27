import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsResolver } from './products.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductsResolver],
  exports: [TypeOrmModule],
})
export class ProductsModule {}
