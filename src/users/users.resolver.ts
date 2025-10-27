import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Query(() => [User])
  async allUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  @Query(() => String)
  @UseGuards(GqlAuthGuard)
  async protectedQuery(@Context() context: any): Promise<string> {
    const user = context.req.user;
    return `Hello authenticated user! Your JWT payload: ${JSON.stringify(user)}`;
  }
}
