import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtAuthConfiguration } from 'src/config/configuration';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule.forFeature(JwtAuthConfiguration),
    MikroOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigType<typeof JwtAuthConfiguration>) => ({
        secret: cfg.secretKey,
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
