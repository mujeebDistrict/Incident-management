import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}