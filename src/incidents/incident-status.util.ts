import { BadRequestException } from '@nestjs/common';
import { IncidentStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ['INVESTIGATING'],
  INVESTIGATING: ['IDENTIFIED'],
  IDENTIFIED: ['MONITORING'],
  MONITORING: ['RESOLVED'],
  RESOLVED: [],
};

export function validateStatusTransition(
  current: IncidentStatus,
  next: IncidentStatus,
): void {
  if (current === next) {
    return;
  }

  const allowed = VALID_TRANSITIONS[current];

  if (!allowed.includes(next)) {
    throw new BadRequestException(
      `Cannot transition incident from ${current} to ${next}`,
    );
  }
}