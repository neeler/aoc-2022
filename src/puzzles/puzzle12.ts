import { Puzzle } from './Puzzle';

function mapHeight(letter: string) {
    return letter.charCodeAt(0) - 'a'.charCodeAt(0);
}

class Point {
    height: number;
    value = Infinity;
    neighbors = Array<Point>();
    isStarting = false;
    isEnding = false;

    constructor({ symbol }: { symbol: string }) {
        if (symbol === 'E') {
            this.value = 0;
            this.height = mapHeight('z');
            this.isEnding = true;
        } else if (symbol === 'S') {
            this.height = mapHeight('a');
            this.isStarting = true;
        } else {
            this.height = mapHeight(symbol);
        }
    }

    link(neighbor?: Point) {
        if (neighbor) {
            this.neighbors.push(neighbor);
        }
    }

    update(value: number) {
        this.value = value;
    }
}

class Map {
    points: Point[][];
    startingPoint: Point;
    endingPoint: Point;

    constructor({
        points,
        startingPoint,
        endingPoint,
    }: {
        points: Point[][];
        startingPoint: Point;
        endingPoint: Point;
    }) {
        this.points = points;
        this.startingPoint = startingPoint;
        this.endingPoint = endingPoint;

        // Link neighbors
        points.forEach((row, iRow) => {
            row.forEach((point, iCol) => {
                point.link(points[iRow - 1]?.[iCol]);
                point.link(points[iRow + 1]?.[iCol]);
                point.link(points[iRow]?.[iCol - 1]);
                point.link(points[iRow]?.[iCol + 1]);
            });
        });

        // Walk and score
        const pointsToWalk: Point[] = [endingPoint];
        while (pointsToWalk.length) {
            const point = pointsToWalk.shift();
            if (point) {
                const newValue = point.value + 1;
                point.neighbors.forEach((neighbor) => {
                    if (
                        neighbor.value > newValue &&
                        neighbor.height >= point.height - 1
                    ) {
                        neighbor.update(newValue);
                        pointsToWalk.push(neighbor);
                    }
                });
            }
        }
    }

    get allPoints() {
        return this.points.flat();
    }
}

export const puzzle12 = new Puzzle({
    day: 12,
    processFile: (fileData) => {
        const symbols = fileData
            .trim()
            .split('\n')
            .map((row) => row.split(''));
        const points = Array<Point[]>();
        let startingPoint: Point | undefined;
        let endingPoint: Point | undefined;
        symbols.forEach((row, iRow) =>
            row.forEach((symbol, iCol) => {
                const pointsRow = points[iRow] ?? [];
                const point = new Point({
                    symbol,
                });
                if (point.isStarting) {
                    startingPoint = point;
                } else if (point.isEnding) {
                    endingPoint = point;
                }
                pointsRow[iCol] = point;
                points[iRow] = pointsRow;
            })
        );
        if (!(startingPoint && endingPoint)) {
            throw new Error('Missing starting and/or ending points');
        }
        return new Map({
            points,
            startingPoint,
            endingPoint,
        });
    },
    part1: (map) => map.startingPoint.value,
    part2: (map) =>
        Math.min(
            ...map.allPoints
                .filter((point) => point.height === 0)
                .map((point) => point.value)
        ),
});
