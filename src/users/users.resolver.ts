import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard, Roles } from '../auth';

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

  @Query(() => [User])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  async adminOnlyUsers(@Context() context: any): Promise<User[]> {
    // Only users with 'admin' role can access this
    return this.userRepository.find();
  }

  @Query(() => String)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  async moderatedContent(@Context() context: any): Promise<string> {
    // Users with either 'admin' or 'moderator' role can access this
    return 'This is moderated content only visible to admins and moderators';
  }
}
