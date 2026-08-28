import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { IncidentStatus } from '@prisma/client';
import { CreateIncidentDto } from './create-incident.dto';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}