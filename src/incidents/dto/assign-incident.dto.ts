import { IsOptional, IsUUID } from "class-validator";

export class AssignIncidentDto {
    @IsUUID()
    @IsOptional()
    assignedTeamId?: string;

    @IsUUID()
    @IsOptional()
    assignedUserId?: string;
}