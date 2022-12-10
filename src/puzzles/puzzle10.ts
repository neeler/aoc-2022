import { Puzzle } from './Puzzle';

type Command = 'noop' | 'addx';

interface Instruction {
    command: Command;
    value?: number;
}

class Circuit {
    private values: number[] = [1];
    private readonly screenWidth = 40;
    private readonly screenHeight = 6;
    private readonly nPixels = this.screenWidth * this.screenHeight;

    constructor({ instructions }: { instructions?: Instruction[] } = {}) {
        if (instructions?.length) {
            instructions.forEach((instruction) => this.process(instruction));
        }
    }

    process(instruction: Instruction) {
        const currentValue = this.values[this.values.length - 1];
        switch (instruction.command) {
            case 'noop': {
                this.values.push(currentValue);
                break;
            }
            case 'addx': {
                this.values.push(
                    currentValue,
                    currentValue + (instruction.value ?? 0)
                );
                break;
            }
        }
    }

    sumSignalStrength() {
        let sum = 0;
        for (let i = 19; i < this.values.length && i < 220; i += 40) {
            sum += (this.values[i] ?? 0) * (i + 1);
        }
        return sum;
    }

    draw() {
        const screen: string[][] = [[]];
        for (let iCycle = 0; iCycle < this.nPixels; iCycle++) {
            const row = screen[screen.length - 1];
            const spritePosition = this.values[iCycle];
            row.push(
                Math.abs(spritePosition - (iCycle % this.screenWidth)) < 2
                    ? '#'
                    : '.'
            );
            if (row.length >= this.screenWidth) {
                screen.push([]);
            }
        }
        return screen.map((row) => row.join('')).join('\n');
    }
}

export const puzzle10 = new Puzzle({
    day: 10,
    processFile: (fileData) => {
        const instructions: Instruction[] = fileData
            .trim()
            .split('\n')
            .map((instruction) => {
                const [command, value] = instruction.split(' ');
                return {
                    command: command as Command,
                    value: value ? parseInt(value, 10) : undefined,
                };
            });
        return new Circuit({
            instructions,
        });
    },
    part1: (circuit) => circuit.sumSignalStrength(),
    part2: (circuit) => `
        
${circuit.draw()}
`,
});
