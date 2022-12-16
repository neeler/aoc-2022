import { Point } from '~/types/Point';

export class Grid<T> {
    private readonly grid: T[][] = [];
    private readonly minX: number;
    private readonly minY: number;
    private minXUpdated: number | undefined;

    constructor({
        minX = 0,
        minY = 0,
        maxX,
        maxY,
        defaultValue,
    }: {
        minX?: number;
        minY?: number;
        maxX: number;
        maxY: number;
        defaultValue: T;
    }) {
        this.grid = Array.from({ length: maxY - minY + 1 }, () =>
            Array.from({ length: maxX - minX + 1 }, () => defaultValue)
        );
        this.minX = minX;
        this.minY = minY;
    }

    getPoint(point: Point) {
        return this.grid[point[1] - this.minY][point[0] - this.minX];
    }

    setPoint(point: Point, value: T) {
        this.grid[point[1] - this.minY][point[0] - this.minX] = value;
        this.minXUpdated =
            this.minXUpdated === undefined
                ? point[0]
                : Math.min(this.minXUpdated, point[0]);
    }

    getRow(y: number) {
        return this.grid[y - this.minY];
    }

    draw() {
        console.log(`
${this.grid
    .map(
        (row, y) =>
            `${(y + this.minY).toString().padStart(4, ' ')} ${row
                .slice((this.minXUpdated ?? 0) > 0 ? this.minXUpdated : 0)
                .join('')}`
    )
    .join('\n')}
`);
    }
}
