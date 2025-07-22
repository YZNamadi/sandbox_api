import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { RolesGuard } from './modules/auth/roles.guard';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DynamicMockRouterService } from './modules/mocks/dynamic-mock-router.service';

// Move OptionalJwtAuthGuard to its own file for reuse

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  // Only apply RolesGuard globally
  app.useGlobalGuards(new RolesGuard(reflector));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.use(helmet());

  // Set app instance for DynamicMockRouterService
  const dynamicMockRouter = app.get(DynamicMockRouterService);
  if (dynamicMockRouter && typeof dynamicMockRouter.setApp === 'function') {
    dynamicMockRouter.setApp(app);
  }

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Sandbox API Virtualization SaaS')
    .setDescription('API documentation for the sandbox backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Healthcheck endpoint
  app.getHttpAdapter().getInstance().get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
