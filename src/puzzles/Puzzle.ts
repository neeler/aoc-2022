interface PuzzleConfig {
    day: number;
    part1: () => string | void;
    part2: () => string | void;
}

export class Puzzle {
    constructor(private readonly config: PuzzleConfig) {}

    run() {
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
*         Answer: ${this.config.part1() ?? ''}  
*                                                 *    
** * * * * * * * * * * * * * * * * * * * * * * * **
*                                                 *         
*         Part 2                                  *     
*                                                 *        
*         Answer: ${this.config.part2() ?? ''}   
*                                                 *    
***************************************************
`);
    }
}
