import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService,
        private readonly redis: RedisService) {}

    async getSummary() {
        const cacheKey = 'dashboard:summary';

        const cached = await this.redis.get(cacheKey);

        if(cached) {
            return JSON.parse(cached);
        }

        const [byStatus, bySeverity, totalOpen] = await Promise.all([
            this.prisma.incident.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.incident.groupBy({
                by: ['severity'],
                _count: true,
            }),
            this.prisma.incident.count({
                where: { status: { not: 'RESOLVED' } },
            }),
        ]);

        const summary = {
            byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
            bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count })),
            totalOpen,
        };

        await this.redis.set(cacheKey, JSON.stringify(summary), 'EX', 15);

        return summary;

    }
}