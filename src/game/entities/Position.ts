export interface Position {
  x: number;
  y: number;
}

export function distance(p1: Position, p2: Position): number {
  return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
}

export function isNeighbor(p1: Position, p2: Position): boolean {
  return distance(p1, p2) === 1;
}

export function isSame(p1: Position, p2: Position): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

export function toKey(p: Position): string {
  return `${p.x.toString()},${p.y.toString()}`;
}

export function isWithinBounds(p: Position, width: number, height: number): boolean {
  return p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
}

export function getNeighbors(p: Position, width: number, height: number): Position[] {
  const neighbors: Position[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const neighbor: Position = { x: p.x + dx, y: p.y + dy };
      if (isWithinBounds(neighbor, width, height)) {
        neighbors.push(neighbor);
      }
    }
  }
  return neighbors;
}
