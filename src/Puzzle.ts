import { readDataFile } from '~/util/readDataFile';

interface PuzzleConfig<TData> {
    day: number;
    processFile: (fileData: string) => TData;
    part1: (data: TData) => any;
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

    run({ testExample = false }: { testExample?: boolean } = {}) {
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
*         Example:                                *
*         ${this.config.part1(this.exampleData) ?? 'Not solved yet...'}${
            testExample
                ? ''
                : `
*                                                 *
*         Answer:                                 *
*         ${
                      testExample
                          ? 'Testing example...'
                          : this.config.part1(this.puzzleData) ??
                            'Not solved yet...'
                  }`
        }
*                                                 *
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *
*         Part 2                                  *
*                                                 *
*         Example:                                *
*         ${this.config.part2(this.exampleData) ?? 'Not solved yet...'}${
            testExample
                ? ''
                : `
*                                                 *
*         Answer:                                 *
*         ${this.config.part2(this.puzzleData) ?? 'Not solved yet...'}`
        }   
*                                                 *
***************************************************
`);
    }
}
