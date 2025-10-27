import { Resolver, Query, Context, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard, Roles } from '../auth';
import { Auth0ManagementService } from '../auth/auth0-management.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auth0ManagementService: Auth0ManagementService,
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

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  async adminCreateManager(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<boolean> {
    try {
      const user = await this.auth0ManagementService.createUser(
        email,
        password,
      );
      const roleId =
        await this.auth0ManagementService.getRoleIdByName('manager');
      await this.auth0ManagementService.assignRoleToUser(user.user_id, roleId);
      return true;
    } catch (error) {
      throw new Error(`Failed to create manager: ${error.message}`);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  async adminCreateUser(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<boolean> {
    try {
      const user = await this.auth0ManagementService.createUser(
        email,
        password,
      );
      const roleId = await this.auth0ManagementService.getRoleIdByName('user');
      await this.auth0ManagementService.assignRoleToUser(user.user_id, roleId);
      return true;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('manager')
  async managerCreateUser(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<boolean> {
    try {
      const user = await this.auth0ManagementService.createUser(
        email,
        password,
      );
      const roleId = await this.auth0ManagementService.getRoleIdByName('user');
      await this.auth0ManagementService.assignRoleToUser(user.user_id, roleId);
      return true;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
}
