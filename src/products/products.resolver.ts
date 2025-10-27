import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @Query(() => [Product])
  @UseGuards(GqlAuthGuard)
  async products(): Promise<Product[]> {
    return this.productRepository.find();
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('user')
  async createProduct(
    @Args('name') name: string,
    @Context() context: any,
  ): Promise<Product> {
    const sub = context.req.user.sub;

    const product = this.productRepository.create({
      name,
      ownerSub: sub,
    });

    return this.productRepository.save(product);
  }
}
