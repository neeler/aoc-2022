import { Point } from '~/types/Point';

export function linePoints([x1, y1]: Point, [x2, y2]: Point): Point[] {
    if (x1 === x2) {
        return Array.from({ length: Math.abs(y2 - y1) + 1 }, (_, i) => [
            x1,
            i + Math.min(y1, y2),
        ]);
    }
    return Array.from({ length: Math.abs(x2 - x1) + 1 }, (_, i) => [
        i + Math.min(x1, x2),
        y1,
    ]);
}
