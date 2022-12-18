import { Timer } from '~/util/Timer';
import { readDataFile } from '~/util/readDataFile';

interface PuzzleConfig<TData> {
    day: number;
    processFile: (
        fileData: string,
        options: { example?: boolean; puzzle?: boolean }
    ) => TData;
    example1?: (data: TData) => any;
    part1: (data: TData) => any;
    example2?: (data: TData) => any;
    part2: (data: TData) => any;
    skipPart1?: boolean;
    skipPart2?: boolean;
}

export class Puzzle<TData> {
    private readonly exampleData: TData;
    private readonly puzzleData: TData;

    constructor(private readonly config: PuzzleConfig<TData>) {
        this.exampleData = this.config.processFile(
            readDataFile(`puzzle${config.day}-example.txt`),
            { example: true }
        );
        this.puzzleData = this.config.processFile(
            readDataFile(`puzzle${config.day}-input.txt`),
            { puzzle: true }
        );
    }

    async run({
        example = false,
        mainProblem = true,
    }: { example?: boolean; mainProblem?: boolean } = {}) {
        const timer = new Timer();
        console.log(`
***************************************************  
*         [Advent of Code 2022]                   *
*         Puzzle ${this.config.day
            .toString()
            .padEnd(2, ' ')}                               *
** * * * * * * * * * * * * * * * * * * * * * * * **
`);
        if (!this.config.skipPart1 && example) {
            const result =
                (await (this.config.example1 ?? this.config.part1)(
                    this.exampleData
                )) ?? 'Not solved yet...';
            console.log(`
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *
*         Part 1 Example                          *
*                                                 *
*         ${result}
*
*         ${timer.time}
*                                                 *
** * * * * * * * * * * * * * * * * * * * * * * * **
`);
        }
        if (!this.config.skipPart1 && mainProblem) {
            timer.reset();
            const result =
                (await this.config.part1(this.puzzleData)) ??
                'Not solved yet...';
            console.log(`
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *
*         Part 1 Answer                           *
*                                                 *
*         ${result}
*
*         ${timer.time}
*                                                 *
** * * * * * * * * * * * * * * * * * * * * * * * **
`);
        }
        if (!this.config.skipPart2 && example) {
            timer.reset();
            const result =
                (await (this.config.example2 ?? this.config.part2)(
                    this.exampleData
                )) ?? 'Not solved yet...';
            console.log(`
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *
*         Part 2 Example                          *
*                                                 *
*         ${result}
*
*         ${timer.time}
*                                                 *
** * * * * * * * * * * * * * * * * * * * * * * * **
`);
        }
        if (!this.config.skipPart2 && mainProblem) {
            timer.reset();
            const result =
                (await this.config.part2(this.puzzleData)) ??
                'Not solved yet...';
            console.log(`
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *
*         Part 2 Answer                           *
*                                                 *
*         ${result}
*
*         ${timer.time}
*                                                 *
** * * * * * * * * * * * * * * * * * * * * * * * **
`);
        }
    }
}
