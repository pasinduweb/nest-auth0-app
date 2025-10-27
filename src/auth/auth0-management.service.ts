import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

interface Auth0ManagementToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface Auth0User {
  user_id: string;
  email: string;
  email_verified: boolean;
  connection: string;
}

interface Auth0Role {
  id: string;
  name: string;
  description?: string;
}

type RoleName = 'admin' | 'manager' | 'user';

@Injectable()
export class Auth0ManagementService {
  private readonly logger = new Logger(Auth0ManagementService.name);
  private managementToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Type guard to check if error is an AxiosError
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return typeof error === 'object' && error !== null && 'response' in error;
  }

  /**
   * Get Auth0 Management API token using client credentials
   */
  private async getManagementToken(): Promise<string> {
    // Check if we have a valid token that hasn't expired
    if (this.managementToken && Date.now() < this.tokenExpiresAt) {
      return this.managementToken;
    }

    const domain = this.configService.get<string>('AUTH0_MGMT_DOMAIN');
    const clientId = this.configService.get<string>('AUTH0_MGMT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'AUTH0_MGMT_CLIENT_SECRET',
    );
    const audience = this.configService.get<string>('AUTH0_MGMT_AUDIENCE');

    if (!domain || !clientId || !clientSecret || !audience) {
      throw new HttpException(
        'Auth0 management API configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<Auth0ManagementToken>(
          `https://${domain}/oauth/token`,
          {
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: audience,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.managementToken = response.data.access_token;
      // Set expiration time with a 5-minute buffer
      this.tokenExpiresAt =
        Date.now() + (response.data.expires_in - 300) * 1000;

      this.logger.log('Successfully obtained Auth0 Management API token');
      return this.managementToken;
    } catch (error) {
      this.logger.error('Failed to obtain Auth0 Management API token', error);
      throw new HttpException(
        'Failed to authenticate with Auth0 Management API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new user in Auth0
   */
  async createUser(email: string, password: string): Promise<Auth0User> {
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const token = await this.getManagementToken();

    if (!domain) {
      throw new HttpException(
        'Auth0 domain configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<Auth0User>(
          `https://${domain}/api/v2/users`,
          {
            email,
            password,
            connection: 'Username-Password-Authentication',
            email_verified: false,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Successfully created user: ${email}`);
      return response.data;
    } catch (error: unknown) {
      this.logger.error(`Failed to create user: ${email}`, error);
      if (this.isAxiosError(error) && error.response?.status === 409) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to create user in Auth0',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get role ID by role name
   */
  async getRoleIdByName(name: RoleName): Promise<string> {
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const token = await this.getManagementToken();

    if (!domain) {
      throw new HttpException(
        'Auth0 domain configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<Auth0Role[]>(`https://${domain}/api/v2/roles`, {
          params: {
            name_filter: name,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      const roles = response.data;
      const role = roles.find((r) => r.name === name);

      if (!role) {
        throw new HttpException(
          `Role '${name}' not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`Found role '${name}' with ID: ${role.id}`);
      return role.id;
    } catch (error) {
      this.logger.error(`Failed to get role ID for: ${name}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve role from Auth0',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const domain = this.configService.get<string>('AUTH0_DOMAIN');
    const token = await this.getManagementToken();

    if (!domain) {
      throw new HttpException(
        'Auth0 domain configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          `https://${domain}/api/v2/users/${userId}/roles`,
          {
            roles: [roleId],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(`Successfully assigned role ${roleId} to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to assign role ${roleId} to user ${userId}`,
        error,
      );
      throw new HttpException(
        'Failed to assign role to user in Auth0',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Convenience method to create a user and assign a role
   */
  async createUserWithRole(
    email: string,
    password: string,
    roleName: RoleName,
  ): Promise<Auth0User> {
    const user = await this.createUser(email, password);
    const roleId = await this.getRoleIdByName(roleName);
    await this.assignRoleToUser(user.user_id, roleId);

    this.logger.log(`Successfully created user ${email} with role ${roleName}`);
    return user;
  }
}
