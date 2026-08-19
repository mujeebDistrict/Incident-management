import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeamDto) {
    const { name } = dto;

    const existingTeam = await this.prisma.team.findUnique({
      where: { name },
    });

    if (existingTeam) {
      throw new ConflictException('A team with this name already exists');
    }

    return this.prisma.team.create({
      data: { name },
    });
  }

  async findAll() {
    return this.prisma.team.findMany();
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }

    return team;
  }

  async update(id: string, dto: UpdateTeamDto) {
    await this.findOne(id);

    return this.prisma.team.update({
      where: { id },
      data: dto,
    });
  }
}