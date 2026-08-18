import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { IncidentsModule } from './incidents/incidents.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [UserModule, AuthModule, IncidentsModule, TeamsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
