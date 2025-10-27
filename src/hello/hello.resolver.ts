import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ObjectType()
export class HelloResponse {
  @Field()
  message: string;
}

@Resolver()
export class HelloResolver {
  @Query(() => HelloResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('admin')
  helloAdmin(): HelloResponse {
    return { message: 'Hello admin' };
  }

  @Query(() => HelloResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('manager')
  helloManager(): HelloResponse {
    return { message: 'Hello manager' };
  }

  @Query(() => HelloResponse)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('user')
  helloUser(): HelloResponse {
    return { message: 'Hello user' };
  }
}
