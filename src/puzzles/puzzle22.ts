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

interface Link3D {
    point: Point;
    direction: Direction;
}

class Board {
    width: number;
    height: number;
    cubeSize: number;
    grid: MapSymbol[][];
    marks: (Arrow | undefined)[][];
    faces: (number | undefined)[][];
    directionLinks3D: (Record<string, Link3D | undefined> | undefined)[][];
    path: (number | RotationDirection)[];
    position: Point;
    direction: Direction = Directions.right;
    private maxCubeIndex: number;

    constructor({
        mapLines,
        path,
    }: {
        mapLines: string[];
        path: (number | RotationDirection)[];
    }) {
        this.width = Math.max(...mapLines.map((row) => row.length));
        this.height = mapLines.length;
        this.cubeSize = Math.round(Math.max(this.width, this.height) / 4);
        this.grid = Array.from({ length: this.height }, () =>
            Array(this.width).fill(MapSymbols.space)
        );
        this.faces = Array.from({ length: this.height }, () =>
            Array(this.width).fill(undefined)
        );
        this.marks = Array.from({ length: this.height }, () =>
            Array(this.width).fill(undefined)
        );
        this.directionLinks3D = Array.from({ length: this.height }, () =>
            Array(this.width).fill(undefined)
        );
        mapLines.forEach((row, y) => {
            row.split('').forEach((symbol, x) => {
                this.grid[y][x] = symbol as MapSymbol;
            });
        });
        const size2 = this.cubeSize * 2;
        const size3 = this.cubeSize * 3;
        const maxCubeIndex = this.cubeSize - 1;
        this.maxCubeIndex = maxCubeIndex;
        for (let y = 0; y < this.cubeSize; y++) {
            for (let x = size2; x < size3; x++) {
                this.faces[y][x] = 1;
                const cubePoint = this.cubify([x, y]);
                const [cubeX, cubeY] = cubePoint;
                this.directionLinks3D[y][x] = this.condenseLinks(
                    {
                        [Directions.right]: {
                            point: this.decubify(
                                [maxCubeIndex, maxCubeIndex - cubeY],
                                6
                            ),
                            direction: Directions.left,
                        },
                        [Directions.left]: {
                            point: this.decubify([cubeY, 0], 3),
                            direction: Directions.down,
                        },
                        [Directions.up]: {
                            point: this.decubify([maxCubeIndex - cubeX, 0], 2),
                            direction: Directions.down,
                        },
                    },
                    cubePoint
                );
            }
        }
        for (let y = this.cubeSize; y < size2; y++) {
            for (let x = 0; x < this.cubeSize; x++) {
                this.faces[y][x] = 2;
                const cubePoint = this.cubify([x, y]);
                const [cubeX, cubeY] = cubePoint;
                this.directionLinks3D[y][x] = this.condenseLinks(
                    {
                        [Directions.left]: {
                            point: this.decubify(
                                [maxCubeIndex - cubeY, maxCubeIndex],
                                6
                            ),
                            direction: Directions.up,
                        },
                        [Directions.up]: {
                            point: this.decubify([maxCubeIndex - cubeX, 0], 1),
                            direction: Directions.down,
                        },
                        [Directions.down]: {
                            point: this.decubify(
                                [maxCubeIndex - cubeX, maxCubeIndex],
                                5
                            ),
                            direction: Directions.up,
                        },
                    },
                    cubePoint
                );
            }
            for (let x = this.cubeSize; x < size2; x++) {
                this.faces[y][x] = 3;
                const cubePoint = this.cubify([x, y]);
                const [cubeX, cubeY] = cubePoint;
                this.directionLinks3D[y][x] = this.condenseLinks(
                    {
                        [Directions.up]: {
                            point: this.decubify([0, cubeX], 1),
                            direction: Directions.right,
                        },
                        [Directions.down]: {
                            point: this.decubify([0, maxCubeIndex - cubeX], 5),
                            direction: Directions.right,
                        },
                    },
                    cubePoint
                );
            }
            for (let x = size2; x < size3; x++) {
                this.faces[y][x] = 4;
                const cubePoint = this.cubify([x, y]);
                const [cubeX, cubeY] = cubePoint;
                this.directionLinks3D[y][x] = this.condenseLinks(
                    {
                        [Directions.right]: {
                            point: this.decubify([maxCubeIndex - cubeY, 0], 6),
                            direction: Directions.down,
                        },
                    },
                    cubePoint
                );
            }
        }
        for (let y = size2; y < size3; y++) {
            for (let x = size2; x < size3; x++) {
                this.faces[y][x] = 5;
                const cubePoint = this.cubify([x, y]);
                const [cubeX, cubeY] = cubePoint;
                this.directionLinks3D[y][x] = this.condenseLinks(
                    {
                        [Directions.left]: {
                            point: this.decubify(
                                [maxCubeIndex - cubeY, maxCubeIndex],
                                3
                            ),
                            direction: Directions.up,
                        },
                        [Directions.down]: {
                            point: this.decubify(
                                [maxCubeIndex - cubeX, maxCubeIndex],
                                2
                            ),
                            direction: Directions.up,
                        },
                    },
                    cubePoint
                );
            }
            for (let x = size3; x < this.width; x++) {
                this.faces[y][x] = 6;
                const cubePoint = this.cubify([x, y]);
                const [cubeX, cubeY] = cubePoint;
                this.directionLinks3D[y][x] = this.condenseLinks(
                    {
                        [Directions.right]: {
                            point: this.decubify(
                                [maxCubeIndex, maxCubeIndex - cubeY],
                                1
                            ),
                            direction: Directions.left,
                        },
                        [Directions.up]: {
                            point: this.decubify(
                                [maxCubeIndex, maxCubeIndex - cubeX],
                                4
                            ),
                            direction: Directions.down,
                        },
                        [Directions.down]: {
                            point: this.decubify([0, maxCubeIndex - cubeX], 2),
                            direction: Directions.right,
                        },
                    },
                    cubePoint
                );
            }
        }
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const face = this.faces[y][x];
                switch (face) {
                    case 1: {
                        break;
                    }
                    case 2: {
                        break;
                    }
                    case 3: {
                        break;
                    }
                    case 4: {
                        break;
                    }
                    case 5: {
                        break;
                    }
                    case 6: {
                        break;
                    }
                }
            }
        }
        this.position = [this.grid[0].indexOf(MapSymbols.open), 0];
        this.path = path;
    }

    condenseLinks(links: Record<string, Link3D>, [x, y]: Point) {
        return {
            [Directions.right]:
                x === this.maxCubeIndex ? links[Directions.right] : undefined,
            [Directions.left]: x === 0 ? links[Directions.left] : undefined,
            [Directions.up]: y === 0 ? links[Directions.up] : undefined,
            [Directions.down]:
                y === this.maxCubeIndex ? links[Directions.down] : undefined,
        };
    }

    cubify([x, y]: Point): Point {
        return [x % this.cubeSize, y % this.cubeSize];
    }

    decubify([x, y]: Point, cube: number): Point {
        switch (cube) {
            case 1: {
                return [x + this.cubeSize * 2, y];
            }
            case 2: {
                return [x, y + this.cubeSize];
            }
            case 3: {
                return [x + this.cubeSize, y + this.cubeSize];
            }
            case 4: {
                return [x + this.cubeSize * 2, y + this.cubeSize];
            }
            case 5: {
                return [x + this.cubeSize * 2, y + this.cubeSize * 2];
            }
            case 6: {
                return [x + this.cubeSize * 3, y + this.cubeSize * 2];
            }
            default: {
                throw new Error(`Invalid cube ${cube}`);
            }
        }
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

    tryPoints(points: (Point | Link3D)[]): Point | undefined {
        for (const data of points) {
            let point: Point | null | undefined;
            if (Array.isArray(data)) {
                const [x, y] = data;
                point = this.getPointIfOpen(x, y);
                if (point) {
                    return point;
                }
                if (point === null) {
                    return undefined;
                }
            } else {
                const { point: nextPoint, direction } = data;
                const [x, y] = nextPoint;
                point = this.getPointIfOpen(x, y);
                if (point) {
                    this.direction = direction;
                    return point;
                }
                if (point === null) {
                    return undefined;
                }
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

    getNextOpenPosition3D(): Point | undefined {
        // console.log(`at ${this.position.join(',')} facing ${this.direction}`);
        const [x, y] = this.position;
        // const [cubeX, cubeY] = this.cubify([x, y]);
        const wrapData = this.directionLinks3D[y][x]?.[this.direction];
        // console.log(wrapData);
        switch (this.direction) {
            case 'R': {
                return this.tryPoints([
                    [x + 1, y],
                    wrapData ?? [
                        this.grid[y].findIndex((s) => s !== MapSymbols.space),
                        y,
                    ],
                ]);
            }
            case 'L': {
                const points: (Point | Link3D)[] = [
                    wrapData ?? [
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
                const points: (Point | Link3D)[] = [
                    wrapData ?? [
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
                    wrapData ?? [
                        x,
                        this.grid.findIndex(
                            (row) => row[x] !== MapSymbols.space
                        ),
                    ],
                ]);
            }
        }
    }

    rotate(dir: RotationDirection) {
        const currentDirectionIndex = clockwiseDirections.indexOf(
            this.direction
        );
        if (dir === 'R') {
            this.direction =
                clockwiseDirections[
                    (currentDirectionIndex + 1) % clockwiseDirections.length
                ];
        } else {
            this.direction =
                clockwiseDirections[
                    (currentDirectionIndex + clockwiseDirections.length - 1) %
                        clockwiseDirections.length
                ];
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
                this.rotate(move);
                this.markMap();
            }
        }
        return this.password;
    }

    followPath3D() {
        this.markMap();
        // this.draw();
        for (const move of this.path) {
            if (typeof move === 'number') {
                for (let i = 0; i < move; i++) {
                    const nextOpenPosition = this.getNextOpenPosition3D();
                    if (nextOpenPosition) {
                        this.position = nextOpenPosition;
                        this.markMap();
                    } else {
                        // console.log('hit wall');
                        break;
                    }
                }
            } else {
                // console.log('turning', move);
                this.rotate(move);
                this.markMap();
                // console.log('facing', this.direction);
            }
            // this.draw();
        }
        // this.draw();
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

    draw3D() {
        console.log(`
${this.grid
    .map((row, y) => row.map((symbol, x) => this.faces[y][x] ?? ' ').join(''))
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
        return {
            mapLines,
            path,
        };
    },
    part1: ({ mapLines, path }) =>
        new Board({
            mapLines,
            path,
        }).followPath(),
    part2: ({ mapLines, path }) => {
        const board = new Board({
            mapLines,
            path,
        });
        return board.followPath3D();
    },
});
