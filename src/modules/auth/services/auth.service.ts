import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/services/user.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
    @InjectRepository(RefreshToken)
    private readonly tokens: EntityRepository<RefreshToken>,
    private readonly em: EntityManager,
  ) {}

  async validateUser(email: string, pass: string) {
    this.logger.debug(`Validating user: ${email}`);
    try {
      const user = await this.users.findByEmail(email);
      const isMatch = user && (await bcrypt.compare(pass, user.password));
      if (isMatch) {
        this.logger.log(`User validated: ${email}`);
        return user;
      }
      this.logger.warn(`Validation failed for user: ${email}`);
      return null;
    } catch (error) {
      this.logger.error(`Error validating user: ${email}`, error.stack);
      throw new InternalServerErrorException(
        `Error validating user ${email}: ${error.message}`,
      );
    }
  }

  async register(email: string, password: string, name: string) {
    this.logger.debug(`Registering new user: ${email}`);
    try {
      const user = await this.users.create({ email, password, name });
      this.logger.log(`User registered: ${email}`);
      return user;
    } catch (error) {
      this.logger.error(`Error registering user: ${email}`, error.stack);
      throw new InternalServerErrorException(
        `Error registering user ${email}: ${error.message}`,
      );
    }
  }

  async login(email: string, password: string) {
    this.logger.debug(`Login attempt: ${email}`);
    try {
      const user = await this.validateUser(email, password);
      if (!user) {
        this.logger.warn(`Unauthorized login for user: ${email}`);
        throw new UnauthorizedException(`Invalid credentials for ${email}`);
      }

      const payload = { sub: user.email };
      const accessToken = this.jwt.sign(payload);
      this.logger.log(`Access token issued for: ${email}`);

      const refreshTokenValue = await this.createRefreshToken(user);
      return { accessToken, refreshToken: refreshTokenValue };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error during login for user: ${email}`, error.stack);
      throw new InternalServerErrorException(
        `Login failed for ${email}: ${error.message}`,
      );
    }
  }

  async refresh(token: string) {
    this.logger.debug(`Refreshing token`);
    try {
      const [id, raw] = token.split('.');
      const existing = await this.tokens.findOne({ id });
      if (!existing || existing.revoked) {
        this.logger.warn(`Invalid or revoked refresh token: ${id}`);
        throw new UnauthorizedException(`Refresh token invalid or revoked`);
      }
      if (existing.expiresAt <= new Date()) {
        this.logger.warn(`Expired refresh token: ${id}`);
        throw new UnauthorizedException(`Refresh token expired`);
      }
      const matches = await bcrypt.compare(raw, existing.tokenHash);
      if (!matches) {
        this.logger.warn(`Refresh token mismatch: ${id}`);
        throw new UnauthorizedException(`Refresh token mismatch`);
      }

      existing.revoked = true;
      await this.em.flush();
      this.logger.log(`Refresh token revoked: ${id}`);

      const payload = { sub: existing.user.email };
      const accessToken = this.jwt.sign(payload);
      this.logger.log(`New access token issued for: ${existing.user.email}`);

      const refreshTokenValue = await this.createRefreshToken(
        existing.user,
        existing,
      );
      return { accessToken, refreshToken: refreshTokenValue };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error refreshing token`, error.stack);
      throw new InternalServerErrorException(
        `Error refreshing token: ${error.message}`,
      );
    }
  }

  async logout(token: string) {
    this.logger.debug(`Logout attempt`);
    try {
      const [id, raw] = token.split('.');
      const existing = await this.tokens.findOne({ id });
      if (!existing) {
        this.logger.warn(`Logout: token not found ${id}`);
        return;
      }
      const matches = await bcrypt.compare(raw, existing.tokenHash);
      if (matches) {
        existing.revoked = true;
        await this.em.flush();
        this.logger.log(`Token revoked on logout: ${id}`);
      } else {
        this.logger.warn(`Logout: token mismatch ${id}`);
      }
    } catch (error) {
      this.logger.error(`Error during logout`, error.stack);
      throw new InternalServerErrorException(`Logout failed: ${error.message}`);
    }
  }

  private async createRefreshToken(
    user: User,
    previous?: RefreshToken,
  ): Promise<string> {
    const token = this.tokens.create({
      user,
      tokenHash: '',
      fingerprint: previous?.fingerprint ?? 'unknown',
      ip: previous?.ip ?? 'unknown',
      userAgent: previous?.userAgent ?? 'unknown',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
    await this.em.persistAndFlush(token);

    const raw = uuidv4();
    token.tokenHash = await bcrypt.hash(raw, 10);
    await this.em.flush();

    this.logger.log(`Refresh token created: ${token.id}`);
    return `${token.id}.${raw}`;
  }
}
