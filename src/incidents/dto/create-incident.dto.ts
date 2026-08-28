import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Severity } from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Severity)
  severity: Severity;

  @IsUUID()
  serviceId: string;
}