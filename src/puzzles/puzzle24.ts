import { Grid } from '~/types/Grid';
import { Point } from '~/types/Point';
import { Puzzle } from './Puzzle';

type Direction = '<' | '>' | '^' | 'v';
const Directions: Record<string, Direction> = {
    LEFT: '<',
    RIGHT: '>',
    DOWN: 'v',
    UP: '^',
};
const AllDirections = [
    Directions.LEFT,
    Directions.RIGHT,
    Directions.DOWN,
    Directions.UP,
];
const directionDiffs = {
    [Directions.UP]: [0, -1],
    [Directions.DOWN]: [0, 1],
    [Directions.LEFT]: [-1, 0],
    [Directions.RIGHT]: [1, 0],
} as Record<Direction, Point>;

class Blizzard {
    id: string;
    position: Point;
    direction: Direction;
    private readonly maxX: number;
    private readonly maxY: number;
    private readonly blizzardsById: Record<string, Blizzard>;
    private readonly grid: Grid<Blizzard[]>;

    constructor({
        x,
        y,
        direction,
        maxX,
        maxY,
        blizzardsById,
        grid,
    }: {
        x: number;
        y: number;
        direction: Direction;
        maxX: number;
        maxY: number;
        blizzardsById: Record<string, Blizzard>;
        grid: Grid<Blizzard[]>;
    }) {
        this.position = [x, y];
        this.direction = direction;
        this.maxX = maxX;
        this.maxY = maxY;
        this.id = this.position.join(',');
        this.blizzardsById = blizzardsById;
        this.grid = grid;
    }

    get positionId() {
        return positionId(this.position);
    }

    move() {
        const blizzardsAtOldPos = (
            this.grid.getPoint(this.position) ?? []
        ).filter((b) => b.id !== this.id);
        this.grid.setPoint(this.position, blizzardsAtOldPos);

        let nextPosition = add(this.position, directionDiffs[this.direction]);
        switch (this.direction) {
            case Directions.LEFT: {
                if (nextPosition[0] < 1) {
                    nextPosition = [this.maxX, nextPosition[1]];
                }
                break;
            }
            case Directions.UP: {
                if (nextPosition[1] < 1) {
                    nextPosition = [nextPosition[0], this.maxY];
                }
                break;
            }
            case Directions.RIGHT: {
                if (nextPosition[0] > this.maxX) {
                    nextPosition = [1, nextPosition[1]];
                }
                break;
            }
            case Directions.DOWN: {
                if (nextPosition[1] > this.maxY) {
                    nextPosition = [nextPosition[0], 1];
                }
                break;
            }
        }
        this.position = nextPosition;
        const blizzardsAtNewPos = (
            this.grid.getPoint(this.position) ?? []
        ).concat(this);
        this.grid.setPoint(this.position, blizzardsAtNewPos);
    }

    toString() {
        return this.direction;
    }
}

interface State {
    position: Point;
    minute: number;
}

class BlizzardMap {
    private readonly blizzards: Blizzard[] = [];
    private readonly blizzardsById: Record<string, Blizzard> = {};
    private readonly grid: Grid<Blizzard[]>;
    private startPosition: Point;
    private goalPosition: Point;
    private queue: State[] = [];
    private nBest = Infinity;
    private readonly maxX: number;
    private readonly maxY: number;
    private bestTrips: number[] = [];

    constructor(rows: string[][]) {
        const firstRow = rows[0];
        const middleRows = rows.slice(1, rows.length - 1);
        const lastRow = rows[rows.length - 1];

        const xStart = firstRow.indexOf('.');
        const xEnd = lastRow.indexOf('.');
        this.startPosition = [xStart, 0];
        this.goalPosition = [xEnd, rows.length - 1];
        this.queue.push({
            position: this.startPosition,
            minute: 0,
        });

        this.maxX = firstRow.length - 2;
        this.maxY = rows.length - 2;

        this.grid = new Grid<Blizzard[]>({
            minX: 1,
            minY: 1,
            maxX: this.maxX,
            maxY: this.maxY,
            blank: '.',
            drawFn: (blizzards?: Blizzard[]) => {
                if (!blizzards?.length) return '.';
                if (blizzards.length === 1) return blizzards[0].toString();
                return blizzards.length.toString();
            },
        });

        middleRows.forEach((row, y) =>
            row.forEach((direction, x) => {
                if (AllDirections.includes(direction as Direction)) {
                    const blizzard = new Blizzard({
                        x,
                        y: y + 1,
                        direction: direction as Direction,
                        maxX: this.maxX,
                        maxY: this.maxY,
                        blizzardsById: this.blizzardsById,
                        grid: this.grid,
                    });
                    this.blizzards.push(blizzard);
                    this.blizzardsById[blizzard.id] = blizzard;
                    const blizzardsAtPosition =
                        this.grid.getPoint(blizzard.position) ?? [];
                    blizzardsAtPosition.push(blizzard);
                    this.grid.setPoint(blizzard.position, blizzardsAtPosition);
                }
            })
        );
    }

    private getPossibleMoves(state: State) {
        const { position, minute } = state;

        if (this.nBest <= minute) {
            return [];
        }

        const nextMoves: State[] = [];

        let foundExit = false;
        const possiblePositions = AllDirections.map((direction) =>
            add(position, directionDiffs[direction])
        ).concat([position]);
        possiblePositions.forEach((nextPosition) => {
            const [x, y] = nextPosition;
            if (equals(nextPosition, this.goalPosition)) {
                this.nBest = Math.min(this.nBest, minute + 1);
                foundExit = true;
                return;
            }
            if (
                (equals(this.startPosition, nextPosition) ||
                    (x > 0 && y > 0 && x <= this.maxX && y <= this.maxY)) &&
                !this.grid.getPoint(nextPosition)?.length
            ) {
                nextMoves.push({
                    position: nextPosition,
                    minute: minute + 1,
                });
            }
        });
        if (foundExit) {
            return [];
        }

        return nextMoves;
    }

    findFastestExit() {
        let iRounds = 0;
        while (this.queue.length) {
            this.runRound();
            iRounds++;
        }

        // Swap goals
        const start = this.startPosition;
        const end = this.goalPosition;
        this.startPosition = end;
        this.goalPosition = start;
        this.bestTrips.push(this.nBest);
        this.queue.push({
            position: this.startPosition,
            minute: 0,
        });

        const nBest = this.nBest;
        this.nBest = Infinity;

        return nBest;
    }

    private moveBlizzards() {
        this.blizzards.forEach((blizzard) => {
            blizzard.move();
        });
    }

    private runRound() {
        this.moveBlizzards();

        const currentStates = this.queue;
        this.queue = [];
        const pointsSeen: Record<string, boolean> = {};
        currentStates.forEach((state) => {
            const possibleMoves = this.getPossibleMoves(state);
            this.queue.push(
                ...possibleMoves.filter(
                    (state) => !pointsSeen[positionId(state.position)]
                )
            );
            possibleMoves.forEach((state) => {
                pointsSeen[positionId(state.position)] = true;
            });
        });
    }

    draw() {
        this.grid.draw();
    }
}

export const puzzle24 = new Puzzle({
    day: 24,
    processFile: (fileData) =>
        fileData
            .trim()
            .split('\n')
            .map((line) => line.split('')),
    part1: (rows) => new BlizzardMap(rows).findFastestExit(),
    part2: (rows) => {
        const blizzardMap = new BlizzardMap(rows);
        return (
            blizzardMap.findFastestExit() +
            1 +
            blizzardMap.findFastestExit() +
            1 +
            blizzardMap.findFastestExit()
        );
    },
});

function add([x1, y1]: Point, [x2, y2]: Point): Point {
    return [x1 + x2, y1 + y2];
}

function equals([x1, y1]: Point, [x2, y2]: Point) {
    return x1 === x2 && y1 === y2;
}

function positionId(pos: Point) {
    return pos.join(',');
}
