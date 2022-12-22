import { Point } from '~/types/Point';
import { Puzzle } from './Puzzle';

type RotationDirection = 'R' | 'L';
type Direction = 'R' | 'L' | 'U' | 'D';
const Directions = {
    right: 'R',
    left: 'L',
    up: 'U',
    down: 'D',
} as const;
const clockwiseDirections = [
    Directions.up,
    Directions.right,
    Directions.down,
    Directions.left,
];

type MapSymbol = '.' | '#' | ' ';
const MapSymbols = {
    open: '.',
    wall: '#',
    space: ' ',
} as const;

type Arrow = '>' | '<' | '^' | 'v';
const Arrows = {
    right: '>',
    left: '<',
    up: '^',
    down: 'v',
} as const;

const directionScores = {
    [Directions.right]: 0,
    [Directions.down]: 1,
    [Directions.left]: 2,
    [Directions.up]: 3,
} as const;

const arrowsByDirection = {
    [Directions.right]: Arrows.right,
    [Directions.left]: Arrows.left,
    [Directions.up]: Arrows.up,
    [Directions.down]: Arrows.down,
} as const;

class Board {
    width: number;
    height: number;
    grid: MapSymbol[][];
    marks: (Arrow | undefined)[][];
    path: (number | RotationDirection)[];
    position: Point;
    direction: Direction = Directions.right;

    constructor({
        mapLines,
        path,
    }: {
        mapLines: string[];
        path: (number | RotationDirection)[];
    }) {
        this.width = Math.max(...mapLines.map((row) => row.length));
        this.height = mapLines.length;
        this.grid = Array.from({ length: this.height }, () =>
            Array(this.width).fill(MapSymbols.space)
        );
        this.marks = Array.from({ length: this.height }, () =>
            Array(this.width).fill(undefined)
        );
        mapLines.forEach((row, y) => {
            row.split('').forEach((symbol, x) => {
                this.grid[y][x] = symbol as MapSymbol;
            });
        });
        this.position = [this.grid[0].indexOf(MapSymbols.open), 0];
        this.path = path;
    }

    getMapAt(x: number, y: number): MapSymbol | undefined {
        return this.grid[y]?.[x];
    }

    getPointIfOpen(x: number, y: number): Point | null | undefined {
        const symbol = this.getMapAt(x, y);
        if (symbol === MapSymbols.wall) {
            return null;
        }
        if (symbol === MapSymbols.open) {
            return [x, y];
        }
        return undefined;
    }

    tryPoints(points: Point[]): Point | undefined {
        for (const [x, y] of points) {
            const point = this.getPointIfOpen(x, y);
            if (point) {
                return point;
            }
            if (point === null) {
                return undefined;
            }
        }
        return undefined;
    }

    getNextOpenPosition(): Point | undefined {
        const [x, y] = this.position;
        switch (this.direction) {
            case 'R': {
                return this.tryPoints([
                    [x + 1, y],
                    [this.grid[y].findIndex((s) => s !== MapSymbols.space), y],
                ]);
            }
            case 'L': {
                const points: Point[] = [
                    [
                        this.grid[y]
                            .map((x) => x !== MapSymbols.space)
                            .lastIndexOf(true),
                        y,
                    ],
                ];
                if (x >= 1) {
                    points.unshift([x - 1, y]);
                    return this.tryPoints(points);
                }
                return this.tryPoints(points);
            }
            case 'U': {
                const points: Point[] = [
                    [
                        x,
                        this.grid
                            .map((row) => row[x] !== MapSymbols.space)
                            .lastIndexOf(true),
                    ],
                ];
                if (y >= 1) {
                    points.unshift([x, y - 1]);
                    return this.tryPoints(points);
                }
                return this.tryPoints(points);
            }
            case 'D': {
                return this.tryPoints([
                    [x, y + 1],
                    [
                        x,
                        this.grid.findIndex(
                            (row) => row[x] !== MapSymbols.space
                        ),
                    ],
                ]);
            }
        }
    }

    followPath() {
        this.markMap();
        for (const move of this.path) {
            if (typeof move === 'number') {
                for (let i = 0; i < move; i++) {
                    const nextOpenPosition = this.getNextOpenPosition();
                    if (nextOpenPosition) {
                        this.position = nextOpenPosition;
                        this.markMap();
                    } else {
                        break;
                    }
                }
            } else {
                const currentDirectionIndex = clockwiseDirections.indexOf(
                    this.direction
                );
                if (move === 'R') {
                    this.direction =
                        clockwiseDirections[
                            (currentDirectionIndex + 1) %
                                clockwiseDirections.length
                        ];
                } else {
                    this.direction =
                        clockwiseDirections[
                            (currentDirectionIndex +
                                clockwiseDirections.length -
                                1) %
                                clockwiseDirections.length
                        ];
                }
                this.markMap();
            }
        }
        return this.password;
    }

    get password() {
        return (
            1000 * (this.position[1] + 1) +
            4 * (this.position[0] + 1) +
            directionScores[this.direction]
        );
    }

    markMap() {
        this.marks[this.position[1]][this.position[0]] =
            arrowsByDirection[this.direction];
    }

    draw() {
        console.log(`
${this.grid
    .map((row, y) =>
        row.map((symbol, x) => this.marks[y][x] ?? symbol).join('')
    )
    .join('\n')}
`);
    }
}

export const puzzle22 = new Puzzle({
    day: 22,
    processFile: (fileData) => {
        const lines = fileData.split('\n');
        const mapLines = Array<string>();
        let mapEnded = false;
        let pathString: string | undefined;
        lines.forEach((line) => {
            if (mapEnded) {
                pathString = pathString || line;
            } else if (line) {
                mapLines.push(line);
            } else {
                mapEnded = true;
            }
        });
        if (!pathString) {
            throw new Error('Parsing error!');
        }
        const path: (number | RotationDirection)[] = [];
        const pathMatches = pathString.matchAll(/(\d*)(\D*)/g);
        for (const match of pathMatches) {
            const [, moveDistance, turnDirection] = match ?? [];
            const distance = Number.parseInt(moveDistance, 10);
            if (!Number.isNaN(distance)) {
                path.push(distance);
            }
            if (turnDirection) {
                path.push(turnDirection as RotationDirection);
            }
        }
        const board = new Board({
            mapLines,
            path,
        });
        return {
            board,
        };
    },
    part1: ({ board }) => board.followPath(),
    part2: (data) => {
        //
    },
});
