import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { JwtStrategy } from './jwt.strategy';
import { GqlAuthGuard } from './gql-auth.guard';
import { RolesGuard } from './roles.guard';
import { Auth0ManagementService } from './auth0-management.service';

@Module({
  imports: [PassportModule, HttpModule],
  providers: [JwtStrategy, GqlAuthGuard, RolesGuard, Auth0ManagementService],
  exports: [GqlAuthGuard, RolesGuard, Auth0ManagementService],
})
export class AuthModule {}
