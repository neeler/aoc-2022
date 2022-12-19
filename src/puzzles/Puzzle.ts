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
    skipExample?: boolean;
    skipPart1?: boolean;
    skipPart2?: boolean;
}

export class Puzzle<TData> {
    constructor(private readonly config: PuzzleConfig<TData>) {}

    async run({
        example = false,
        mainProblem = true,
    }: { example?: boolean; mainProblem?: boolean } = {}) {
        const exampleData = example
            ? this.config.processFile(
                  readDataFile(`puzzle${this.config.day}-example.txt`),
                  { example: true }
              )
            : undefined;
        const puzzleData = mainProblem
            ? this.config.processFile(
                  readDataFile(`puzzle${this.config.day}-input.txt`),
                  { puzzle: true }
              )
            : undefined;

        const timer = new Timer();
        console.log(`
***************************************************  
*         [Advent of Code 2022]                   *
*         Puzzle ${this.config.day
            .toString()
            .padEnd(2, ' ')}                               *
** * * * * * * * * * * * * * * * * * * * * * * * **
`);
        if (!this.config.skipPart1 && exampleData) {
            const result =
                (await (this.config.example1 ?? this.config.part1)(
                    exampleData
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
        if (!this.config.skipPart1 && puzzleData) {
            timer.reset();
            const result =
                (await this.config.part1(puzzleData)) ?? 'Not solved yet...';
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
        if (!this.config.skipPart2 && exampleData) {
            timer.reset();
            const result =
                (await (this.config.example2 ?? this.config.part2)(
                    exampleData
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
        if (!this.config.skipPart2 && puzzleData) {
            timer.reset();
            const result =
                (await this.config.part2(puzzleData)) ?? 'Not solved yet...';
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
