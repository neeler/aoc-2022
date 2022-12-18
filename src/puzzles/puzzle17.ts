import { Point } from '~/types/Point';
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

    getPotentialYPositions(direction: Direction) {
        const directionDiff = directionDiffs[direction];
        const mins = Array(7).fill(Infinity) as Row<number>;
        const maxes = Array(7).fill(-Infinity) as Row<number>;
        rockPositions[this.shape].forEach(([dx, dy]) => {
            const x = dx + this.focalPoint[0] + directionDiff[0];
            const y = dy + this.focalPoint[1] + directionDiff[1];
            mins[x] = Math.min(mins[x], y);
            maxes[x] = Math.max(maxes[x], y);
        });
        return {
            mins,
            maxes,
        };
    }

    isXBounded(direction: Direction) {
        const directionDiff = directionDiffs[direction];
        return rockPositions[this.shape].some(([dx]) => {
            const x = dx + this.focalPoint[0] + directionDiff[0];
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
    private maxHeight = 0;
    private cycle: {
        heightBeforeStart: number;
        iLastBefore: number;
        iLast: number;
        cycleLength: number;
        heightAfterCycle: number;
        cycleStepHeights: number[];
    };

    constructor({ rocks, jetPatterns }: PuzzleData) {
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
        if (this.cycle) return this.cycle;
        try {
            while (true) {
                this.addRock();
            }
        } catch {
            //
        }
        if (!this.cycle) {
            throw new Error('Cycle not found!');
        }
        return this.cycle;
    }

    private addRock() {
        if (this.cycle) return;

        const rock = new Rock({
            shape: this.rocks[this.iRock],
            highestRock: this.maxHeight,
        });

        this.iTotalRocks = this.iTotalRocks + 1;
        this.iRock = this.iTotalRocks % this.rocks.length;

        let rockMaxes: number[] = [];
        while (true) {
            const jet = this.jetPattern;
            const isXBounded = rock.isXBounded(jet);
            if (!isXBounded) {
                const { mins: jetMins, maxes } =
                    rock.getPotentialYPositions(jet);
                if (!this.collidesWithRock(jetMins)) {
                    rock.move(jet);
                    rockMaxes = maxes;
                }
            }
            this.iJet = (this.iJet + 1) % this.jetPatterns.length;

            const { mins: rockMins, maxes } =
                rock.getPotentialYPositions('down');
            if (this.collidesWithRock(rockMins)) {
                // Settle rock
                rockMaxes.forEach((y, x) => {
                    if (y > this.maxHeights[x]) {
                        this.maxHeights[x] = y;
                    }
                });
                break;
            } else {
                rock.move('down');
                rockMaxes = maxes;
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
            console.log(
                `Cycle detected at rock ${this.iTotalRocks}! height: ${this.maxHeight}`
            );
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
            console.log(this.cycle);
            throw new Error('cycle!');
        } else {
            this.nRocksBySignature[this.signature] = this.iTotalRocks;
            this.heightsBySignature[this.signature] = this.maxHeight;
            this.heightsByRockIndex[this.iTotalRocks] = this.maxHeight;
        }
    }

    private collidesWithRock(minHeights: Row<number>) {
        return minHeights.some((y, x) => this.maxHeights[x] >= y);
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
