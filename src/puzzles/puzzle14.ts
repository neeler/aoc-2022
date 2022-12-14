import { setTimeout } from 'timers/promises';
import { Puzzle } from './Puzzle';

const ROCK = '#';
const AIR = '.';
const SOURCE = '+';
const SAND = 'o';

type Point = [number, number];
const sourceX = 500;
const sourceY = 0;

class Cave {
    private grid: string[][];
    private readonly width: number;
    private readonly height: number;
    private readonly minX: number;
    private readonly minY: number;
    sandCount = 0;

    constructor({
        rockStrings,
        hasFloor,
    }: {
        rockStrings: string[];
        hasFloor: boolean;
    }) {
        let maxX = sourceX;
        let maxY = sourceY;
        let minX = Infinity;
        let minY = Infinity;
        const pointsPerRock: Point[][] = rockStrings.map((rockString) =>
            rockString.split(' -> ').map((pointString) => {
                const [x, y] = pointString
                    .split(',')
                    .map((n) => parseInt(n, 10));
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                return [x, y];
            })
        );
        this.width = maxX + 200;
        this.height = maxY + (hasFloor ? 3 : 1);
        this.minX = minX;
        this.minY = minY;
        this.grid = Array.from({ length: this.height }, () =>
            Array.from({ length: this.width }, () => AIR)
        );
        pointsPerRock.forEach((rockPoints) => {
            let previousPoint: Point | undefined;
            rockPoints.forEach((point) => {
                previousPoint = previousPoint ?? point;
                const pointsInLine = linePoints(previousPoint, point);
                pointsInLine.forEach(([rockX, rockY]) => {
                    this.grid[rockY][rockX] = ROCK;
                });
                previousPoint = point;
            });
        });
        if (hasFloor) {
            const pointsInFloor = linePoints(
                [0, maxY + 2],
                [this.grid[0].length - 1, maxY + 2]
            );
            pointsInFloor.forEach(([rockX, rockY]) => {
                this.grid[rockY][rockX] = ROCK;
            });
        }
        this.grid[sourceY][sourceX] = SOURCE;
    }

    async addSand() {
        let outOfBounds = false;
        while (!outOfBounds) {
            let x = sourceX;
            let y = sourceY;
            while (true) {
                const nextRow = this.grid[y + 1];
                if (nextRow) {
                    if (this.grid[y + 1]?.[x] === AIR) {
                        y++;
                    } else if (this.grid[y + 1]?.[x - 1] === AIR) {
                        x--;
                        y++;
                    } else if (this.grid[y + 1]?.[x + 1] === AIR) {
                        x++;
                        y++;
                    } else {
                        this.sandCount++;
                        this.grid[y][x] = SAND;
                        if (x === sourceX && y === sourceY) {
                            outOfBounds = true;
                            break;
                        }
                        // this.draw();
                        // await setTimeout(100);
                        break;
                    }
                } else {
                    outOfBounds = true;
                    break;
                }
            }
        }
        // this.draw();
    }

    draw() {
        console.log(`
${this.grid.map((row) => row.slice(this.minX - 10).join('')).join('\n')}
`);
    }
}

function linePoints([x1, y1]: Point, [x2, y2]: Point): Point[] {
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

export const puzzle14 = new Puzzle({
    day: 14,
    processFile: (fileData) => fileData.trim().split('\n'),
    part1: async (rockStrings) => {
        const cave = new Cave({
            rockStrings,
            hasFloor: false,
        });
        await cave.addSand();
        return cave.sandCount;
    },
    part2: async (rockStrings) => {
        const cave = new Cave({
            rockStrings,
            hasFloor: true,
        });
        await cave.addSand();
        return cave.sandCount;
    },
});
