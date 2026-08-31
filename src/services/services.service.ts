import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async create(dto: CreateServiceDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const service = await this.prisma.service.create({ data: dto });
    await this.redis.del('services:all');
    return service;
  }

  async findAll() {
    // return this.prisma.service.findMany();
    const cacheKey = 'services:all';

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const services = await this.prisma.service.findMany();
    await this.redis.set(cacheKey, JSON.stringify(services), 'EX', 30);

    return services;
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);

    const service = await this.prisma.service.update({
      where: { id },
      data: dto,
    });
    
    await this.redis.del('services:all');
    return service;
  }
}