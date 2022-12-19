import { Point3D } from '~/types/Point';
import { Puzzle } from './Puzzle';

const dNeighbors: Point3D[] = [
    [-1, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
];

class Cube {
    location: Point3D;
    id: string;
    neighborIds: string[];

    constructor(location: Point3D) {
        this.location = location;
        this.id = Cube.idAt(location);
        this.neighborIds = dNeighbors.map((dLoc) =>
            Cube.idAt(dLoc.map((d, i) => d + location[i]) as Point3D)
        );
    }

    static idAt(location: Point3D) {
        return location.join(',');
    }
}

class LavaMap {
    mins: Point3D = [Infinity, Infinity, Infinity];
    maxes: Point3D = [-Infinity, -Infinity, -Infinity];
    cubes: Record<string, boolean> = {};
    cubesById: Record<string, Cube> = {};
    boundaryCubes: Record<string, boolean> = {};
    interiorFacingCubes: Record<string, boolean> = {};
    totalSurfaceArea = 0;
    exteriorSurfaceArea = 0;

    constructor({
        cubes,
        justTotal = false,
    }: {
        cubes: Cube[];
        justTotal?: boolean;
    }) {
        cubes.forEach((cube) => this.addCube(cube));

        this.exteriorSurfaceArea = this.totalSurfaceArea;
        cubes.forEach((cube) => {
            if (cube.neighborIds.some((id) => !this.cubes[id])) {
                this.boundaryCubes[cube.id] = true;
            }
        });

        if (!justTotal) {
            const nonLavaCubes: Cube[] = [];
            for (let x = this.mins[0] - 1; x <= this.maxes[0] + 1; x++) {
                for (let y = this.mins[1] - 1; y <= this.maxes[1] + 1; y++) {
                    for (
                        let z = this.mins[2] - 1;
                        z <= this.maxes[2] + 1;
                        z++
                    ) {
                        const location = [x, y, z] as Point3D;
                        if (!this.cubes[Cube.idAt(location)]) {
                            nonLavaCubes.push(new Cube(location));
                        }
                    }
                }
            }
            let positionsToDo = nonLavaCubes.slice();
            let shouldRunFilter = false;
            let nLoops = 0;
            do {
                nLoops++;
                const nonLavaCubesById = Object.fromEntries(
                    positionsToDo.map((nlc) => [nlc.id, nlc])
                );
                const remainingToDo: Cube[] = [];
                let hasRemoved = false;
                positionsToDo.forEach((cube) => {
                    if (
                        cube.neighborIds.every(
                            (id) => this.cubes[id] || nonLavaCubesById[id]
                        )
                    ) {
                        remainingToDo.push(cube);
                    } else {
                        hasRemoved = true;
                    }
                });
                positionsToDo = remainingToDo;
                shouldRunFilter = hasRemoved;
            } while (shouldRunFilter);

            const airBubbleCubes = positionsToDo;
            const airBubbleMap = new LavaMap({
                cubes: airBubbleCubes,
                justTotal: true,
            });

            this.exteriorSurfaceArea =
                this.totalSurfaceArea - airBubbleMap.totalSurfaceArea;
        }
    }

    private addCube(cube: Cube) {
        this.cubesById[cube.id] = cube;
        let nAlreadySeen = 0;
        this.mins.forEach((coord, i) => {
            this.mins[i] = Math.min(coord, cube.location[i]);
        });
        this.maxes.forEach((coord, i) => {
            this.maxes[i] = Math.max(coord, cube.location[i]);
        });
        cube.neighborIds.forEach((id) => {
            if (this.cubes[id]) {
                nAlreadySeen++;
            }
        });
        this.cubes[cube.id] = true;
        this.totalSurfaceArea += 6 - 2 * nAlreadySeen;
    }
}

export const puzzle18 = new Puzzle({
    day: 18,
    processFile: (fileData) => {
        const cubes = fileData
            .trim()
            .split('\n')
            .map(
                (row) =>
                    new Cube(
                        row.split(',').map((n) => parseInt(n, 10)) as Point3D
                    )
            );
        return new LavaMap({ cubes });
    },
    part1: (lavaMap) => lavaMap.totalSurfaceArea,
    part2: (lavaMap) => lavaMap.exteriorSurfaceArea,
});
