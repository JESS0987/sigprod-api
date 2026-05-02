import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Swagger / OpenAPI 3.0
  const config = new DocumentBuilder()
    .setTitle('SIGPROD API')
    .setDescription(
      `## Sistema Integral de Gestión de Producción de Software
      
**TechSoft Solutions S.A.S.** - Bucaramanga, Santander, Colombia

API REST para la plataforma SIGPROD que unifica todos los módulos del ciclo de vida del desarrollo de software.

### Módulos disponibles:
- 🔐 **Auth** - Autenticación JWT
- 👥 **Users** - Gestión de usuarios y roles
- 📁 **Projects** - Gestión de proyectos
- 🏃 **Sprints** - Gestión de sprints (Scrum Master)
- 📋 **Backlog** - Product Backlog (Product Owner)
- 📄 **Requirements** - Historias de usuario y casos de uso (Business Analyst)
- 🏗️ **Architecture** - Arquitectura y contratos API (Architect)
- 🎨 **Design** - Design System y mockups (UI/UX)
- ✅ **QA** - Pruebas y defectos (QA Engineer)
- 🚀 **DevOps** - CI/CD y despliegues (DevOps Engineer)
      `,
    )
    .setVersion('1.0.0')
    .setContact('TechSoft Solutions', 'https://techsoft.com.co', 'dev@techsoft.com.co')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Health', 'Estado del sistema')
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Projects', 'Gestión de proyectos')
    .addTag('Sprints', 'Scrum Master - Gestión de sprints')
    .addTag('Backlog', 'Product Owner - Backlog del producto')
    .addTag('Requirements', 'Business Analyst - Requisitos y casos de uso')
    .addTag('Architecture', 'Arquitecto - Definición técnica')
    .addTag('Design', 'UI/UX - Design system y mockups')
    .addTag('QA', 'QA Engineer - Pruebas y defectos')
    .addTag('DevOps', 'DevOps Engineer - CI/CD y despliegues')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'SIGPROD API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 SIGPROD API corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
