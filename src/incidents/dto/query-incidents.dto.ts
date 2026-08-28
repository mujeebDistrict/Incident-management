import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentStatus, Severity } from '@prisma/client';

export class QueryIncidentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @IsUUID()
  @IsOptional()
  serviceId?: string;
}