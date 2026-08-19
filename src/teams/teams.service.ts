import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

  async addMember(teamId: string, userId: string) {
    const foundTeam = await this.findOne(teamId);
    const foundUser = await this.prisma.user.findUnique({where: {
      id: userId,
    }});

    if (!foundUser) {
      throw new NotFoundException();
    }

    try {
      return await this.prisma.teamMember.create({ data: {
        teamId, userId  
      }});
    } catch(error) {  
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('User is already a member of this team');
      }
      throw error;
    }
  }

  async removeMember(teamId: string, userId: string) {
    await this.findOne(teamId);

    try {
      await this.prisma.teamMember.delete({
        where: {
          userId_teamId: { userId, teamId },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('This user is not a member of this team');
      }
      throw error;
    }
  }
}