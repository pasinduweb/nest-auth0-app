import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GqlAuthGuard } from './gql-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, GqlAuthGuard, RolesGuard],
  exports: [GqlAuthGuard, RolesGuard],
})
export class AuthModule {}
