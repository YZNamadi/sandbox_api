import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RoleSeeder } from './modules/users/role.seeder';
import { SandboxesModule } from './modules/sandboxes/sandboxes.module';
import { MocksModule } from './modules/mocks/mocks.module';
import { LogsModule } from './modules/logs/logs.module';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CIIntegrationsModule } from './modules/ci-integrations/ci-integrations.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { HealthController } from './modules/health/health.controller';
import { AppService } from './app.service';
import { RedisProvider } from './utils/redis.provider';

@Module({
  imports: [
    // ConfigModule must be imported first for environment variable access
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
      },
    ]),
    // Use forRootAsync to inject ConfigService for DB config
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Ensure ConfigModule is available
      inject: [ConfigService], // Only inject ConfigService
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: true, // Set to false in production!
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('POSTGRES_HOST', 'localhost'),
          port: parseInt(config.get<string>('POSTGRES_PORT', '5432'), 10),
          username: config.get<string>('POSTGRES_USER', 'sandbox'),
          password: config.get<string>('POSTGRES_PASSWORD', 'sandboxpass'),
          database: config.get<string>('POSTGRES_DB', 'sandbox'),
          autoLoadEntities: true,
          synchronize: true, // Set to false in production!
          ssl: { rejectUnauthorized: false },
        };
      },
    }),
    AuthModule,
    UsersModule,
    SandboxesModule,
    MocksModule,
    LogsModule,
    SimulationsModule,
    PaymentsModule,
    CIIntegrationsModule,
    // Redis integration will be added in a provider
  ],
  controllers: [AppController, HealthController],
  providers: [RoleSeeder, AppService, RedisProvider],
})
export class AppModule {}

// ---
// Explanations:
// - Removed ModuleRef from TypeOrmModule.forRootAsync inject array (not needed for DB config)
// - Ensured ConfigModule is imported before TypeOrmModule
// - All DB connection values are now read from .env via ConfigService (best practice for 12-factor apps)
// - This setup is robust for local/dev and production environments
