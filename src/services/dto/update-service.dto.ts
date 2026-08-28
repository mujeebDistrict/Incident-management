import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ServiceStatus } from '@prisma/client';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;
}