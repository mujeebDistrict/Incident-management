import { BadRequestException } from '@nestjs/common';
import { validateStatusTransition } from './incident-status.util';

describe('validateStatusTransition', () => {
  it('allows OPEN -> INVESTIGATING', () => {
    expect(() => validateStatusTransition('OPEN', 'INVESTIGATING')).not.toThrow();
  });

  it('allows INVESTIGATING -> IDENTIFIED', () => {
    expect(() => validateStatusTransition('INVESTIGATING', 'IDENTIFIED')).not.toThrow();
  });

  it('allows IDENTIFIED -> MONITORING', () => {
    expect(() => validateStatusTransition('IDENTIFIED', 'MONITORING')).not.toThrow();
  });

  it('allows MONITORING -> RESOLVED', () => {
    expect(() => validateStatusTransition('MONITORING', 'RESOLVED')).not.toThrow();
  });

  it('allows a same-status no-op', () => {
    expect(() => validateStatusTransition('OPEN', 'OPEN')).not.toThrow();
  });

  it('rejects skipping stages (OPEN -> MONITORING)', () => {
    expect(() => validateStatusTransition('OPEN', 'MONITORING')).toThrow(BadRequestException);
  });

  it('rejects skipping stages (OPEN -> RESOLVED)', () => {
    expect(() => validateStatusTransition('OPEN', 'RESOLVED')).toThrow(BadRequestException);
  });

  it('rejects any transition out of RESOLVED (no reopening)', () => {
    expect(() => validateStatusTransition('RESOLVED', 'OPEN')).toThrow(BadRequestException);
    expect(() => validateStatusTransition('RESOLVED', 'INVESTIGATING')).toThrow(BadRequestException);
  });

  it('rejects moving backwards (INVESTIGATING -> OPEN)', () => {
    expect(() => validateStatusTransition('INVESTIGATING', 'OPEN')).toThrow(BadRequestException);
  });
});