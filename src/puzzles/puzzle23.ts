import { Grid } from '~/types/Grid';
import { Point } from '~/types/Point';
import { Puzzle } from './Puzzle';

const directions = ['N', 'NE', 'NW', 'S', 'SE', 'SW', 'E', 'W'];
const directionDiffs: Record<string, Point> = {
    N: [0, -1],
    NE: [1, -1],
    NW: [-1, -1],
    S: [0, 1],
    SE: [1, 1],
    SW: [-1, 1],
    E: [1, 0],
    W: [-1, 0],
};

class Elf {
    id: string;
    position: Point;
    private readonly elvesById: Record<string, Elf>;
    private readonly elvesByPosition: Record<string, Elf | undefined> = {};
    private neighbors: { [p: string]: Elf | undefined } = {};
    private proposers: [string[], Point][] = [
        [
            ['N', 'NE', 'NW'],
            [0, -1],
        ],
        [
            ['S', 'SE', 'SW'],
            [0, 1],
        ],
        [
            ['W', 'NW', 'SW'],
            [-1, 0],
        ],
        [
            ['E', 'NE', 'SE'],
            [1, 0],
        ],
    ];

    constructor({
        x,
        y,
        elvesById,
        elvesByPosition,
    }: {
        x: number;
        y: number;
        elvesById: Record<string, Elf>;
        elvesByPosition: Record<string, Elf | undefined>;
    }) {
        this.position = [x, y];
        this.id = this.position.join(',');
        this.elvesById = elvesById;
        this.elvesByPosition = elvesByPosition;
    }

    private getNeighbors() {
        return Object.fromEntries(
            Object.entries(directionDiffs).map(([direction, diffs]) => [
                direction,
                this.elvesByPosition[positionId(add(this.position, diffs))],
            ])
        );
    }

    get positionId() {
        return positionId(this.position);
    }

    noNeighborsAt(dirs: string[]) {
        return dirs.every((dir) => !this.neighbors[dir]);
    }

    get proposedMove() {
        this.neighbors = this.getNeighbors();

        if (this.noNeighborsAt(directions)) {
            return undefined;
        }

        for (const [directionsToCheck, positionDiff] of this.proposers) {
            if (this.noNeighborsAt(directionsToCheck)) {
                return add(this.position, positionDiff);
            }
        }
    }

    move(point: Point) {
        this.elvesByPosition[this.positionId] = undefined;

        this.position = point;
        this.neighbors = this.getNeighbors();
        this.elvesByPosition[this.positionId] = this;
    }

    rotateProposers() {
        const firstProposer = this.proposers.shift();
        if (firstProposer) {
            this.proposers.push(firstProposer);
        }
    }

    toString() {
        return '#';
    }
}

class GroveMap {
    elves: Elf[] = [];
    elvesById: Record<string, Elf> = {};
    elvesByPosition: Record<string, Elf | undefined> = {};

    constructor(rows: string[][]) {
        rows.forEach((row, y) =>
            row.forEach((char, x) => {
                if (char === '#') {
                    const elf = new Elf({
                        x,
                        y,
                        elvesById: this.elvesById,
                        elvesByPosition: this.elvesByPosition,
                    });
                    this.elves.push(elf);
                    this.elvesById[elf.id] = elf;
                    this.elvesByPosition[elf.positionId] = elf;
                }
            })
        );
    }

    private runRound() {
        let someoneMoved = false;

        const positionCounts: Record<string, number> = {};
        const proposalsByElfId: Record<string, Point> = {};
        this.elves.forEach((elf) => {
            const position = elf.proposedMove;
            if (position) {
                positionCounts[positionId(position)] =
                    (positionCounts[positionId(position)] ?? 0) + 1;
                proposalsByElfId[elf.id] = position;
            }
        });
        this.elves.forEach((elf) => {
            const position = proposalsByElfId[elf.id];
            const nProposals = position
                ? positionCounts[positionId(position)] ?? 0
                : 0;
            if (position && nProposals === 1) {
                someoneMoved = true;
                elf.move(position);
            }
            elf.rotateProposers();
        });

        return someoneMoved;
    }

    runRounds(nRounds: number) {
        for (let iRound = 0; iRound < nRounds; iRound++) {
            this.runRound();
        }
    }

    findMaxRounds() {
        let iRound = 0;
        while (true) {
            const someoneMoved = this.runRound();
            iRound++;
            if (!someoneMoved) {
                break;
            }
        }
        return iRound;
    }

    private bounds() {
        let xMin = Infinity;
        let yMin = Infinity;
        let xMax = -Infinity;
        let yMax = -Infinity;
        this.elves.forEach((elf) => {
            const [x, y] = elf.position;
            xMin = Math.min(x, xMin);
            yMin = Math.min(y, yMin);
            xMax = Math.max(x, xMax);
            yMax = Math.max(y, yMax);
        });
        return {
            xMin,
            yMin,
            xMax,
            yMax,
        };
    }

    countEmptyTiles() {
        const { xMin, xMax, yMin, yMax } = this.bounds();
        let nEmpties = 0;
        for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
                const maybeElf = this.elvesByPosition[positionId([x, y])];
                if (!maybeElf) {
                    nEmpties++;
                }
            }
        }
        return nEmpties;
    }

    draw() {
        const { xMin, xMax, yMin, yMax } = this.bounds();
        const grid = new Grid<Elf>({
            minX: xMin,
            minY: yMin,
            maxX: xMax,
            maxY: yMax,
            blank: ' ',
        });
        this.elves.forEach((elf) => {
            grid.setPoint(elf.position, elf);
        });
        grid.draw();
    }
}

export const puzzle23 = new Puzzle({
    day: 23,
    processFile: (fileData) =>
        fileData
            .trim()
            .split('\n')
            .map((line) => line.split('')),
    part1: (rows) => {
        const groveMap = new GroveMap(rows);
        groveMap.runRounds(10);
        return groveMap.countEmptyTiles();
    },
    part2: (rows) => {
        const groveMap = new GroveMap(rows);
        return groveMap.findMaxRounds();
    },
});

function add([x1, y1]: Point, [x2, y2]: Point): Point {
    return [x1 + x2, y1 + y2];
}

function positionId(pos: Point) {
    return pos.join(',');
}
