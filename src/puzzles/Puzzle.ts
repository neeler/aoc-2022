import { readDataFile } from '~/util/readDataFile';

interface PuzzleConfig<TData> {
    day: number;
    processFile: (fileData: string) => TData;
    example1?: (data: TData) => any;
    part1: (data: TData) => any;
    example2?: (data: TData) => any;
    part2: (data: TData) => any;
}

export class Puzzle<TData> {
    private readonly exampleData: TData;
    private readonly puzzleData: TData;

    constructor(private readonly config: PuzzleConfig<TData>) {
        this.exampleData = this.config.processFile(
            readDataFile(`puzzle${config.day}-example.txt`)
        );
        this.puzzleData = this.config.processFile(
            readDataFile(`puzzle${config.day}-input.txt`)
        );
    }

    async run({
        example = false,
        mainProblem = true,
    }: { example?: boolean; mainProblem?: boolean } = {}) {
        console.log(`
***************************************************  
*         [Advent of Code 2022]                   *
*         Puzzle ${this.config.day
            .toString()
            .padEnd(2, ' ')}                               *
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *
*         Part 1                                  *
*                                                 *
${
    example
        ? `*
*         Example:                                *
*         ${
              (await (this.config.example1 ?? this.config.part1)(
                  this.exampleData
              )) ?? 'Not solved yet...'
          }`
        : ''
}${
            mainProblem
                ? `
*                                                 *
*         Answer:                                 *
*         ${(await this.config.part1(this.puzzleData)) ?? 'Not solved yet...'}`
                : ''
        }
*                                                 *
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *
*         Part 2                                  *
*                                                 *
${
    example
        ? `*         
*         Example:                                *
*         ${
              (await (this.config.example2 ?? this.config.part2)(
                  this.exampleData
              )) ?? 'Not solved yet...'
          }`
        : ''
}
*         ${
            mainProblem
                ? `
*                                                 *
*         Answer:                                 *
*         ${(await this.config.part2(this.puzzleData)) ?? 'Not solved yet...'}`
                : ''
        }   
*                                                 *
***************************************************
`);
    }
}
