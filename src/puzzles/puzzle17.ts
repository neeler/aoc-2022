import { Point } from '~/types/Point';
import { numbersBetween } from '~/util/numbersBetween';
import { readDataFile } from '~/util/readDataFile';
import { Puzzle } from './Puzzle';

type Row<T> = [T, T, T, T, T, T, T];
type Direction = 'down' | '<' | '>';

interface PuzzleData {
    rocks: string[];
    jetPatterns: Direction[];
}

const rocks = ['-', '+', 'L', '|', '0'];
const rockPositions: Record<string, Point[]> = {
    '-': [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
    ],
    '+': [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
    ],
    L: [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
        [2, 2],
    ],
    '|': [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
    ],
    '0': [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
    ],
};
const directionDiffs: Record<Direction, Point> = {
    down: [0, -1],
    '<': [-1, 0],
    '>': [1, 0],
};

class Rock {
    private shape: string;
    focalPoint: Point;

    constructor({
        shape,
        highestRock,
    }: {
        shape: string;
        highestRock: number;
    }) {
        this.shape = shape;
        this.focalPoint = [2, highestRock + 3];
    }

    get positions(): Point[] {
        return rockPositions[this.shape].map(([x, y]) => [
            x + this.focalPoint[0],
            y + this.focalPoint[1],
        ]);
    }

    getPositionsIf(direction: Direction): Point[] {
        const directionDiff = directionDiffs[direction];
        return this.positions.map(([x, y]) => [
            x + directionDiff[0],
            y + directionDiff[1],
        ]);
    }

    isXBounded(direction: Direction) {
        return this.getPositionsIf(direction).some(([x]) => {
            return x < 0 || x > 6;
        });
    }

    move(direction: Direction) {
        const directionDiff = directionDiffs[direction];
        this.focalPoint = [
            this.focalPoint[0] + directionDiff[0],
            this.focalPoint[1] + directionDiff[1],
        ];
    }
}

class Grid {
    private iRock = 0;
    private iTotalRocks = 0;
    private iJet = 0;
    private rocks: string[];
    private jetPatterns: Direction[];
    private maxHeights: Row<number> = [-1, -1, -1, -1, -1, -1, -1];
    private relativeHeights: Row<number> = [0, 0, 0, 0, 0, 0, 0];
    private signature: string = '0:0:0,0,0,0,0,0,0';
    private heightsBySignature: Record<string, number> = {
        [this.signature]: 0,
    };
    private nRocksBySignature: Record<string, number> = {
        [this.signature]: 0,
    };
    private heightsByRockIndex: number[] = [0];
    private signaturesByRockIndex: string[] = [this.signature];
    private maxHeight = 0;
    private cycle: {
        heightBeforeStart: number;
        iLastBefore: number;
        iLast: number;
        cycleLength: number;
        heightAfterCycle: number;
        cycleStepHeights: number[];
    };
    private readonly grid: Row<boolean>[] = [];

    constructor({ rocks, jetPatterns }: PuzzleData & {}) {
        this.rocks = rocks;
        this.jetPatterns = jetPatterns;
        this.cycle = this.findCycle();
    }

    private get jetPattern(): Direction {
        return this.jetPatterns[this.iJet % this.jetPatterns.length];
    }

    getHeightAt(iRock: number) {
        const {
            iLastBefore,
            iLast,
            cycleLength,
            heightBeforeStart,
            heightAfterCycle,
            cycleStepHeights,
        } = this.cycle;

        if (iRock <= iLast) {
            return this.heightsByRockIndex[iRock];
        }

        const nAfterCycleStart = Math.max(0, iRock - iLastBefore);
        const nCycles = Math.floor(nAfterCycleStart / cycleLength);
        const cycleStep = nAfterCycleStart % cycleLength;

        return (
            heightBeforeStart +
            nCycles * heightAfterCycle +
            cycleStepHeights[cycleStep]
        );
    }

    private findCycle() {
        while (!this.cycle) {
            this.addRock();
        }
        return this.cycle;
    }

    private fitRock(rock: Rock) {
        rock.positions.forEach(([x, y]) => {
            while (this.grid.length < y + 1) {
                this.grid.push(Array(7).fill(false) as Row<boolean>);
            }
        });
    }

    private addRock() {
        const rock = new Rock({
            shape: this.rocks[this.iRock],
            highestRock: this.maxHeight,
        });
        this.fitRock(rock);

        this.iTotalRocks = this.iTotalRocks + 1;
        this.iRock = this.iTotalRocks % this.rocks.length;

        while (true) {
            const jet = this.jetPattern;
            const isXBounded = rock.isXBounded(jet);
            if (!isXBounded) {
                if (!this.collidesWithRock(rock.getPositionsIf(jet))) {
                    rock.move(jet);
                }
            }
            this.iJet = (this.iJet + 1) % this.jetPatterns.length;

            if (this.collidesWithRock(rock.getPositionsIf('down'))) {
                // Settle rock
                rock.positions.forEach(([x, y]) => {
                    const row = this.grid[y];
                    row[x] = true;
                    this.grid[y] = row;
                    if (y > this.maxHeights[x]) {
                        this.maxHeights[x] = y;
                    }
                });
                break;
            } else {
                rock.move('down');
            }
        }

        this.maxHeight = Math.max(...this.maxHeights) + 1;
        const minHeight = Math.min(...this.maxHeights);
        this.relativeHeights = this.maxHeights.map(
            (height) => height - minHeight
        ) as Row<number>;
        this.signature = `${this.iRock}:${
            this.iJet
        }:${this.relativeHeights.join(',')}`;

        if (this.heightsBySignature[this.signature] !== undefined) {
            // Cycle detected
            const iLast = this.iTotalRocks - 1;
            const cycleLength =
                this.iTotalRocks - this.nRocksBySignature[this.signature];
            const iLastBefore = iLast - cycleLength;
            const heightBeforeStart = this.heightsByRockIndex[iLastBefore] ?? 0;
            this.cycle = {
                heightBeforeStart,
                iLastBefore,
                iLast,
                cycleLength,
                heightAfterCycle:
                    this.heightsByRockIndex[this.iTotalRocks - 1] -
                    heightBeforeStart,
                cycleStepHeights: Array.from(
                    { length: cycleLength },
                    (v, i) =>
                        this.heightsByRockIndex[iLastBefore + i] -
                        heightBeforeStart
                ),
            };
        }

        this.signaturesByRockIndex[this.iTotalRocks] = this.signature;
        this.nRocksBySignature[this.signature] = this.iTotalRocks;
        this.heightsBySignature[this.signature] = this.maxHeight;
        this.heightsByRockIndex[this.iTotalRocks] = this.maxHeight;
    }

    private collidesWithRock(points: Point[]) {
        return points.some(
            (point) => this.grid[point[1]]?.[point[0]] !== false
        );
    }
}

export const puzzle17 = new Puzzle({
    day: 17,
    processFile: (fileData, { example }) => {
        const jetPatterns = fileData.trim().split('') as Direction[];
        const grid = new Grid({
            rocks,
            jetPatterns,
        });
        if (example) {
            testAgainstInputs(grid);
        }
        return grid;
    },
    part1: async (grid) => grid.getHeightAt(2022),
    part2: async (grid) => grid.getHeightAt(1000000000000),
});

function testAgainstInputs(grid: Grid) {
    const file = readDataFile('puzzle17-tests.txt');
    const tests = file
        .trim()
        .split('\n')
        .map((height, i) => ({
            iRock: i + 1,
            height: parseInt(height, 10),
        }));
    tests.forEach(({ iRock, height }) => {
        const calculatedHeight = grid.getHeightAt(iRock);
        if (height !== calculatedHeight) {
            throw new Error(
                `mismatch at ${iRock}: ${height} vs ${calculatedHeight}`
            );
        }
    });
}
