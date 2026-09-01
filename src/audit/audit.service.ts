import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    oldValue?: Prisma.InputJsonValue,
    newValue?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValue, newValue },
    });
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { data, total, page, limit };
  }
}