import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { SprintsModule } from './sprints/sprints.module';
import { BacklogModule } from './backlog/backlog.module';
import { RequirementsModule } from './requirements/requirements.module';
import { ArchitectureModule } from './architecture/architecture.module';
import { DesignModule } from './design/design.module';
import { QaModule } from './qa/qa.module';
import { DevopsModule } from './devops/devops.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    SprintsModule,
    BacklogModule,
    RequirementsModule,
    ArchitectureModule,
    DesignModule,
    QaModule,
    DevopsModule,
  ],
})
export class AppModule {}
