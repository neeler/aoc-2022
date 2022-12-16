import { Point } from '~/types/Point';
import { collapseRanges, Range } from '~/util/collapseRanges';
import { manhattanDistance } from '~/util/manhattanDistance';
import { Puzzle } from './Puzzle';

interface SensorData {
    sensor: Point;
    beacon: Point;
    distance: number;
    distanceLeft: (row: number) => number;
}

class CaveMap {
    distressLocation?: Point;
    private readonly sensorData: SensorData[];
    private occupiedLocations: Record<string, Record<string, number>> = {};

    constructor({ sensors }: { sensors: string[] }) {
        this.sensorData = sensors.reduce((soFar, line) => {
            const [, sX, sY, bX, bY] =
                line
                    .match(
                        /Sensor at x=(-?\d*), y=(-?\d*): closest beacon is at x=(-?\d*), y=(-?\d*)/
                    )
                    ?.map((n) => parseInt(n, 10)) ?? [];
            if ([sX, sY, bX, bY].every((n) => n !== undefined)) {
                const sensor: Point = [sX, sY];
                this.occupiedLocations[sY] = {
                    ...(this.occupiedLocations[sY] ?? {}),
                    [sX]: sX,
                };
                const beacon: Point = [bX, bY];
                this.occupiedLocations[bY] = {
                    ...(this.occupiedLocations[bY] ?? {}),
                    [bX]: bX,
                };
                const distance = manhattanDistance(sensor, beacon);
                soFar.push({
                    sensor,
                    beacon,
                    distance,
                    distanceLeft: (targetRow: number) =>
                        distance - Math.abs(targetRow - sensor[1]),
                });
            }
            return soFar;
        }, Array<SensorData>());
    }

    getRelevantSensors(targetRow: number) {
        return this.sensorData.reduce(
            (sensors, { distanceLeft, sensor }) => {
                const distanceRemaining = distanceLeft(targetRow);
                if (distanceRemaining >= 0) {
                    sensors.push({
                        sensorMinX: sensor[0] - distanceRemaining,
                        sensorMaxX: sensor[0] + distanceRemaining,
                    });
                }
                return sensors;
            },
            Array<{
                sensorMinX: number;
                sensorMaxX: number;
            }>()
        );
    }

    getConfirmedEmptyCount({
        targetRow,
        minX,
        maxX,
    }: {
        targetRow: number;
        minX: number;
        maxX: number;
    }) {
        const confirmedEmptiesInRow: Record<string, boolean> = {};
        const occupiedLocationsInRow = this.occupiedLocations[targetRow] ?? {};

        let nConfirmedEmpties = 0;

        const relevantSensors = this.getRelevantSensors(targetRow);

        for (const { sensorMinX, sensorMaxX } of relevantSensors) {
            const limit = Math.min(maxX, sensorMaxX);
            for (let x = Math.max(minX, sensorMinX); x <= limit; x++) {
                if (
                    occupiedLocationsInRow[x] === undefined &&
                    !confirmedEmptiesInRow[x]
                ) {
                    // confirm as empty
                    confirmedEmptiesInRow[x] = true;
                    nConfirmedEmpties++;
                }
            }
        }

        const spacesLeftAfterEmpties = maxX - minX + 1 - nConfirmedEmpties;

        if (spacesLeftAfterEmpties > 0) {
            const nOtherThings = Object.values(occupiedLocationsInRow).filter(
                (x) => x >= minX && x <= maxX
            );
            if (spacesLeftAfterEmpties - nOtherThings.length === 1) {
                for (let x = minX; x <= maxX; x++) {
                    if (
                        occupiedLocationsInRow[x] === undefined &&
                        !confirmedEmptiesInRow[x]
                    ) {
                        this.distressLocation = [x, targetRow];
                    }
                }
            }
        }

        return nConfirmedEmpties;
    }

    getTuningFrequency({
        minX,
        maxX,
        minY,
        maxY,
    }: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    }) {
        for (let targetRow = minY; targetRow <= maxY; targetRow++) {
            if (targetRow % 100000 === 0) {
                console.log('searching', targetRow);
            }

            const occupiedLocationsInRow =
                this.occupiedLocations[targetRow] ?? {};
            const relevantSensors = this.getRelevantSensors(targetRow);

            const ranges: Range[] = relevantSensors.map(
                ({ sensorMinX, sensorMaxX }) => ({
                    min: Math.max(minX, sensorMinX),
                    max: Math.min(maxX, sensorMaxX),
                })
            );
            ranges.push(
                ...Object.values(occupiedLocationsInRow).reduce(
                    (locations, x) => {
                        if (x >= minX && x <= maxX) {
                            locations.push({
                                min: x,
                                max: x,
                            });
                        }
                        return locations;
                    },
                    Array<Range>()
                )
            );
            const combinedRanges = collapseRanges(ranges);

            if (combinedRanges.length === 2) {
                console.log(combinedRanges);
                const minRange =
                    combinedRanges[
                        combinedRanges[0].min < combinedRanges[1].min ? 0 : 1
                    ];
                this.distressLocation = [minRange.max + 1, targetRow];
                console.log(this.distressLocation);
                break;
            }
        }
        return (
            (this.distressLocation?.[0] ?? 0) * 4000000 +
            (this.distressLocation?.[1] ?? 0)
        );
    }
}

export const puzzle15 = new Puzzle({
    day: 15,
    processFile: (fileData) =>
        new CaveMap({
            sensors: fileData.trim().split('\n'),
        }),
    example1: (caveMap) =>
        caveMap.getConfirmedEmptyCount({
            targetRow: 10,
            minX: -10,
            maxX: 30,
        }),
    part1: (caveMap) =>
        caveMap.getConfirmedEmptyCount({
            targetRow: 2000000,
            minX: -500000,
            maxX: 5000000,
        }),
    example2: (caveMap) =>
        caveMap.getTuningFrequency({
            minX: 0,
            maxX: 20,
            minY: 0,
            maxY: 20,
        }),
    part2: (caveMap) =>
        caveMap.getTuningFrequency({
            minX: 0,
            maxX: 4000000,
            minY: 0,
            maxY: 4000000,
        }),
});
