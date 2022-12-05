import { Puzzle } from './Puzzle';

type Stack = string[];
interface CrateMove {
    quantity: number;
    iFrom: number;
    iTo: number;
}

interface FileInput {
    stacks: Stack[];
    moves: CrateMove[];
}

export const puzzle5 = new Puzzle({
    day: 5,
    processFile: (fileData): FileInput => {
        const dataRows = fileData.split('\n');
        let inStacks = true;
        const stacks = Array<Stack>();
        const moves = Array<string>();
        dataRows.forEach((row) => {
            if (row && inStacks) {
                if (!row.trim().startsWith('[')) {
                    return;
                }

                const stackCharWidth = 4;
                const nStacksRepresented = Math.floor(
                    (row.length + 2) / stackCharWidth
                );
                for (let iStack = 0; iStack < nStacksRepresented; iStack++) {
                    const crateLabel = row
                        .charAt(1 + stackCharWidth * iStack)
                        .trim();
                    if (crateLabel) {
                        const stackSoFar = stacks[iStack] ?? Array<string>();
                        stackSoFar.unshift(crateLabel);
                        stacks[iStack] = stackSoFar;
                    }
                }
            } else if (inStacks) {
                inStacks = false;
            } else if (row) {
                moves.push(row);
            }
        });
        return {
            stacks,
            moves: moves.map((moveString) => {
                const [moveText, quantity, fromText, iFrom, toText, iTo] =
                    moveString.split(/\s/);
                return {
                    quantity: parseInt(quantity, 10),
                    iFrom: parseInt(iFrom, 10) - 1,
                    iTo: parseInt(iTo, 10) - 1,
                };
            }),
        };
    },
    part1: ({ stacks: initialStacks, moves }) => {
        const stacks = initialStacks.map((stack) => stack.slice());
        moves.forEach((move) => {
            const fromStack = stacks[move.iFrom];
            const toStack = stacks[move.iTo];
            for (let i = 0; i < move.quantity; i++) {
                const topCrate = fromStack.pop();
                if (topCrate) {
                    toStack.push(topCrate);
                }
            }
        });
        return stacks.map((stack) => stack[stack.length - 1]).join('');
    },
    part2: ({ stacks: initialStacks, moves }) => {
        const stacks = initialStacks.map((stack) => stack.slice());
        moves.forEach((move) => {
            const fromStack = stacks[move.iFrom];
            const toStack = stacks[move.iTo];
            const moveStack = Array<string>();
            for (let i = 0; i < move.quantity; i++) {
                const topCrate = fromStack.pop();
                if (topCrate) {
                    moveStack.unshift(topCrate);
                }
            }
            toStack.push(...moveStack);
        });
        return stacks.map((stack) => stack[stack.length - 1]).join('');
    },
});
