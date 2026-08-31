import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { AssignIncidentDto } from './dto/assign-incident.dto';
import { PrismaService } from '../prisma/prisma.service';
import { validateStatusTransition } from './incident-status.util';
import { Prisma } from '@prisma/client';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IncidentsGateway } from './incidents.gateway';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService, 
    @InjectQueue('notificationQueue') private readonly notificationQueue: Queue,
    private readonly incidentsGateway: IncidentsGateway
  ) {}

  async create(dto: CreateIncidentDto, currentUserId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const incident = await this.prisma.incident.create({
      data: { ...dto, status: 'OPEN', createdById: currentUserId },
    });

    await this.prisma.incidentEvent.create({
      data: {
        incidentId: incident.id,
        type: 'CREATED',
      },
    });

    if (incident.severity === 'CRITICAL' && incident.assignedUserId) {
      await this.notificationQueue.add('critical-incident', {
        incidentId: incident.id,
        userId: incident.assignedUserId,
        message: `Critical incident created: ${incident.title}`,
      });
    }

    return incident;
  }

  ///////////////////////////////////////
  async findAll(query: QueryIncidentsDto) {
    const { page = 1, limit = 20, severity, status, serviceId } = query;

    const where: Prisma.IncidentWhereInput = {
      ...(severity && { severity }),
      ...(status && { status }),
      ...(serviceId && { serviceId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.incident.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return { data, total, page, limit };

  }
  ///////////////////////////////////////
  async findOne(id: string) {
  const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }

    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto) {
    const incident = await this.findOne(id);

    if (dto.status) {
      validateStatusTransition(incident.status, dto.status);
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== incident.status) {
      await this.prisma.incidentEvent.create({
        data: {
          incidentId: id,
          type: 'STATUS_CHANGED',
          payload: { from: incident.status, to: dto.status },
        },
      });
    }

    this.incidentsGateway.emitIncidentUpdated(id);

    return updated;
  }

  async resolve(id: string) {
    const incident = await this.findOne(id);

    validateStatusTransition(incident.status, 'RESOLVED');

    const updated = await this.prisma.incident.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });

    await this.prisma.incidentEvent.create({
      data: {
        incidentId: id,
        type: 'RESOLVED',
      },
    });

    this.incidentsGateway.emitIncidentUpdated(id);

    return updated;
  }

  async assign(id: string, dto: AssignIncidentDto) {
    const incident = await this.findOne(id);

    const updated = await this.prisma.incident.update({
      where: { id },
      data: dto,
    });

    await this.prisma.incidentEvent.create({
      data: {
        incidentId: id,
        type: 'ASSIGNED',
        payload: { ...dto },
      },
    });

    if (dto.assignedUserId && incident.severity === 'CRITICAL') {
      await this.notificationQueue.add('critical-assignment', {
        incidentId: id,
        userId: dto.assignedUserId,
        message: `You've been assigned a critical incident: ${incident.title}`,
      });
    }

    this.incidentsGateway.emitIncidentUpdated(id);

    return updated;
  }
}