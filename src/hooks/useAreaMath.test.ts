import { describe, expect, it } from 'vitest';
import { calculateAreaMetrics, type RoomType } from './useAreaMath';

describe('calculateAreaMetrics', () => {
  it('computes a valid classroom area using shoelace math', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 6, y: 0, z: 0 },
      { x: 6, y: 0, z: 5 },
      { x: 0, y: 0, z: 5 }
    ];

    const metrics = calculateAreaMetrics(points, 'classroom');

    expect(metrics.areaSqM).toBeCloseTo(30, 2);
    expect(metrics.perimeterM).toBeCloseTo(22, 2);
    expect(metrics.isCompliant).toBe(true);
  });

  it('flags labs below the required threshold', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 7, y: 0, z: 0 },
      { x: 7, y: 0, z: 7 },
      { x: 0, y: 0, z: 7 }
    ];

    const metrics = calculateAreaMetrics(points, 'lab');

    expect(metrics.areaSqM).toBeCloseTo(49, 2);
    expect(metrics.isCompliant).toBe(false);
  });
});
