import { Point } from '~/types/Point';

export function manhattanDistance(p1: Point, p2: Point) {
    return Math.abs(p2[0] - p1[0]) + Math.abs(p2[1] - p1[1]);
}
