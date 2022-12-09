import { Puzzle } from './Puzzle';

type Direction = 'R' | 'L' | 'U' | 'D';

type Position = [number, number];

interface Instruction {
    direction: Direction;
    count: number;
}

const positionDiffMap: Record<Direction, Position> = {
    R: [1, 0],
    L: [-1, 0],
    U: [0, 1],
    D: [0, -1],
};

function positionKey(position: Position) {
    return position.join(':');
}

function add([x1, y1]: Position, [x2, y2]: Position): Position {
    return [x1 + x2, y1 + y2];
}

function distance(position1: Position, position2: Position) {
    return Math.sqrt(
        (position1[0] - position2[0]) ** 2 + (position1[1] - position2[1]) ** 2
    );
}

function getDiff(position1: Position, position2: Position): Position {
    return [
        position1[0] === position2[0]
            ? 0
            : position1[0] > position2[0]
            ? 1
            : -1,
        position1[1] === position2[1]
            ? 0
            : position1[1] > position2[1]
            ? 1
            : -1,
    ];
}

const sqrt2 = Math.sqrt(2);

function analyzeInstructions({
    instructions,
    nKnots,
}: {
    instructions: Instruction[];
    nKnots: number;
}) {
    const knotPositions = Array.from(
        {
            length: nKnots,
        },
        () => [0, 0] as Position
    );
    const getHead = () => knotPositions[0] as Position;
    const getTail = () => knotPositions[nKnots - 1] as Position;
    const positionsVisited: Record<string, boolean> = {
        [positionKey(getTail())]: true,
    };
    instructions.forEach(({ count, direction }) => {
        const positionDiff = positionDiffMap[direction];
        for (let i = 0; i < count; i++) {
            knotPositions[0] = add(getHead(), positionDiff);

            for (let iKnot = 1; iKnot < nKnots; iKnot++) {
                const leader = knotPositions[iKnot - 1] as Position;
                const follower = knotPositions[iKnot] as Position;
                const dKnots = distance(leader, follower);

                if (dKnots > sqrt2) {
                    knotPositions[iKnot] = add(
                        follower,
                        getDiff(leader, follower)
                    );
                }
            }

            positionsVisited[positionKey(getTail())] = true;
        }
    });
    return positionsVisited;
}

export const puzzle9 = new Puzzle({
    day: 9,
    processFile: (fileData) => {
        const instructions: Instruction[] = fileData
            .trim()
            .split('\n')
            .map((instruction) => {
                const [direction, count] = instruction.split(' ');
                return {
                    direction: direction as Direction,
                    count: parseInt(count, 10),
                };
            });
        return instructions;
    },
    part1: (instructions) =>
        Object.keys(
            analyzeInstructions({
                instructions,
                nKnots: 2,
            })
        ).length,
    part2: (instructions) =>
        Object.keys(
            analyzeInstructions({
                instructions,
                nKnots: 10,
            })
        ).length,
});
