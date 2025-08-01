import { registerAs } from '@nestjs/config';
import { JwtAuthConfig } from './types/jwt-auth.config';
import { AppConfig } from './types/app.config';
import { SendGridConfig } from './types/sendgrid.config';

export const AppConfiguration = registerAs(
  'appConfig',
  (): AppConfig => ({
    clientBaseUrl: process.env.CLIENT_BASE_URL,
    apiBaseUrl: process.env.API_BASE_URL,
  }),
);

export const JwtAuthConfiguration = registerAs(
  'jwtAuthConfig',
  (): JwtAuthConfig => ({
    secretKey: process.env.JWT_SECRET_KEY || 'secret',
    resetPwdSecretKey:
      process.env.RESET_PWD_JWT_SECRET_KEY || 'reset-pwd-secret',
  }),
);

export const SendGridConfiguration = registerAs(
  'sendGridConfig',
  (): SendGridConfig => ({
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.VERIFIED_EMAIL,
  }),
);
