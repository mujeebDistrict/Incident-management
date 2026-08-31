import { Module } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { BullModule } from '@nestjs/bullmq';
import { IncidentsGateway } from './incidents.gateway';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notificationQueue',
    }),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsGateway],
})
export class IncidentsModule {}
