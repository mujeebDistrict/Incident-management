import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { IncidentsModule } from './incidents/incidents.module';
import { TeamsModule } from './teams/teams.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    UserModule, AuthModule, IncidentsModule, TeamsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
