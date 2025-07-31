import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/services/user.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
    @InjectRepository(RefreshToken)
    private readonly tokens: EntityRepository<RefreshToken>,
    private readonly em: EntityManager,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.users.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException();
    const payload = { sub: user.email };
    const accessToken = this.jwt.sign(payload);

    const refreshToken = this.tokens.create({
      user,
      tokenHash: '',
      fingerprint: 'unknown',
      ip: 'unknown',
      userAgent: 'unknown',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
    await this.em.persistAndFlush(refreshToken);

    const random = uuidv4();
    refreshToken.tokenHash = await bcrypt.hash(random, 10);
    await this.em.flush();
    const refreshTokenValue = `${refreshToken.id}.${random}`;

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async refresh(token: string) {
    const [id, raw] = token.split('.');
    const existing = await this.tokens.findOne({ id });
    if (!existing || existing.revoked) throw new UnauthorizedException();
    if (existing.expiresAt <= new Date()) throw new UnauthorizedException();
    const matches = await bcrypt.compare(raw, existing.tokenHash);
    if (!matches) throw new UnauthorizedException();

    existing.revoked = true;
    await this.em.flush();

    const payload = { sub: existing.user.email };
    const accessToken = this.jwt.sign(payload);

    const newToken = this.tokens.create({
      user: existing.user,
      tokenHash: '',
      fingerprint: existing.fingerprint,
      ip: existing.ip,
      userAgent: existing.userAgent,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
    await this.em.persistAndFlush(newToken);
    const random = uuidv4();
    newToken.tokenHash = await bcrypt.hash(random, 10);
    await this.em.flush();

    const refreshTokenValue = `${newToken.id}.${random}`;
    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async logout(token: string) {
    const [id, raw] = token.split('.');
    const existing = await this.tokens.findOne({ id });
    if (!existing) return;
    const matches = await bcrypt.compare(raw, existing.tokenHash);
    if (matches) {
      existing.revoked = true;
      await this.em.flush();
    }
  }
}
