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
      throw new InternalServerErrorException(error);
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
      throw new InternalServerErrorException(error);
    }
  }

  async login(email: string, password: string) {
    this.logger.debug(`Login attempt: ${email}`);
    try {
      const user = await this.validateUser(email, password);
      if (!user) {
        this.logger.warn(`Unauthorized login for user: ${email}`);
        throw new UnauthorizedException();
      }

      const payload = { sub: user.email };
      const accessToken = this.jwt.sign(payload);
      this.logger.log(`Access token issued for: ${email}`);

      const refreshToken = this.tokens.create({
        user,
        tokenHash: '',
        fingerprint: 'unknown',
        ip: 'unknown',
        userAgent: 'unknown',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });
      await this.em.persistAndFlush(refreshToken);

      const raw = uuidv4();
      refreshToken.tokenHash = await bcrypt.hash(raw, 10);
      await this.em.flush();
      const refreshTokenValue = `${refreshToken.id}.${raw}`;
      this.logger.log(`Refresh token created for: ${email}`);

      return { accessToken, refreshToken: refreshTokenValue };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error during login for user: ${email}`, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async refresh(token: string) {
    this.logger.debug(`Refreshing token`);
    try {
      const [id, raw] = token.split('.');
      const existing = await this.tokens.findOne({ id });
      if (!existing || existing.revoked) {
        this.logger.warn(`Invalid or revoked refresh token: ${id}`);
        throw new UnauthorizedException();
      }
      if (existing.expiresAt <= new Date()) {
        this.logger.warn(`Expired refresh token: ${id}`);
        throw new UnauthorizedException();
      }
      const matches = await bcrypt.compare(raw, existing.tokenHash);
      if (!matches) {
        this.logger.warn(`Refresh token mismatch: ${id}`);
        throw new UnauthorizedException();
      }

      existing.revoked = true;
      await this.em.flush();
      this.logger.log(`Refresh token revoked: ${id}`);

      const payload = { sub: existing.user.email };
      const accessToken = this.jwt.sign(payload);
      this.logger.log(`New access token issued for: ${existing.user.email}`);

      const newToken = this.tokens.create({
        user: existing.user,
        tokenHash: '',
        fingerprint: existing.fingerprint,
        ip: existing.ip,
        userAgent: existing.userAgent,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });
      await this.em.persistAndFlush(newToken);

      const rawNew = uuidv4();
      newToken.tokenHash = await bcrypt.hash(rawNew, 10);
      await this.em.flush();

      const refreshTokenValue = `${newToken.id}.${rawNew}`;
      this.logger.log(`New refresh token created: ${newToken.id}`);
      return { accessToken, refreshToken: refreshTokenValue };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error refreshing token`, error.stack);
      throw new InternalServerErrorException(error);
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
      throw new InternalServerErrorException(error);
    }
  }
}
