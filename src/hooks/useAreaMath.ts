export type RoomType = 'classroom' | 'lab';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface AreaMetrics {
  perimeterM: number;
  areaSqM: number;
  isCompliant: boolean;
  requiredMinSqM: number;
  roomType: RoomType;
  corners: number;
}

export const ROOM_THRESHOLDS: Record<RoomType, number> = {
  classroom: 66,
  lab: 132
};

export function calculateAreaMetrics(points: Point3D[], roomType: RoomType): AreaMetrics {
  const floorPoints = points.map(({ x, z }) => ({ x, z }));

  if (floorPoints.length < 3) {
    return {
      perimeterM: 0,
      areaSqM: 0,
      isCompliant: false,
      requiredMinSqM: ROOM_THRESHOLDS[roomType],
      roomType,
      corners: points.length
    };
  }

  let area2D = 0;
  let perimeter = 0;

  for (let index = 0; index < floorPoints.length; index += 1) {
    const current = floorPoints[index];
    const next = floorPoints[(index + 1) % floorPoints.length];

    area2D += current.x * next.z - next.x * current.z;

    perimeter += Math.hypot(next.x - current.x, next.z - current.z);
  }

  const areaSqM = Math.abs(area2D) / 2;
  const isCompliant = areaSqM >= ROOM_THRESHOLDS[roomType];

  return {
    perimeterM: Number(perimeter.toFixed(2)),
    areaSqM: Number(areaSqM.toFixed(2)),
    isCompliant,
    requiredMinSqM: ROOM_THRESHOLDS[roomType],
    roomType,
    corners: points.length
  };
}

export function getComplianceLabel(value: number, roomType: RoomType): string {
  const threshold = ROOM_THRESHOLDS[roomType];
  const ratio = value / threshold;

  if (value >= threshold) {
    return `Compliant (${ratio.toFixed(2)}x standard)`;
  }

  return `Deficient (${Math.max(0, threshold - value).toFixed(1)} m² short)`;
}
