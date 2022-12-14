import { writeFileSync, readdirSync } from 'fs';
import path from 'path';

const dataFolder = path.join(__dirname, '../../data');
const puzzleFolder = path.join(__dirname, '../puzzles');
const srcFolder = path.join(__dirname, '..');

/** Figure out next puzzle number **/
const existingDataFiles = readdirSync(dataFolder);
const existingPuzzleNumbers = existingDataFiles
    .map((fileName) => parseInt(fileName.split('-')[0].slice(6), 10))
    .sort((a, b) => b - a);
const lastPuzzleNumber = existingPuzzleNumbers[0];
const nextPuzzle = lastPuzzleNumber ? lastPuzzleNumber + 1 : 1;

/** Generate blank puzzle files **/
writeFileSync(path.join(dataFolder, `puzzle${nextPuzzle}-example.txt`), '');
writeFileSync(path.join(dataFolder, `puzzle${nextPuzzle}-input.txt`), '');
writeFileSync(
    path.join(puzzleFolder, `puzzle${nextPuzzle}.ts`),
    `import { Puzzle } from './Puzzle';

export const puzzle${nextPuzzle} = new Puzzle({
    day: ${nextPuzzle},
    processFile: (fileData) => {
        const lines = fileData.trim().split('\\n');
        return lines;
    },
    part1: (data) => {
        console.log(data);
    },
    part2: (data) => {
        //
    },
});
`
);
writeFileSync(
    path.join(puzzleFolder, 'index.ts'),
    `${Array.from(
        { length: nextPuzzle },
        (v, i) => `export { puzzle${i + 1} } from './puzzle${i + 1}';`
    ).join('\n')}
`
);
writeFileSync(
    path.join(srcFolder, 'index.ts'),
    `import {
${Array.from({ length: nextPuzzle }, (v, i) => `    puzzle${i + 1},`).join(
    '\n'
)}
} from '~/puzzles';

async function start() {    
${Array.from(
    { length: nextPuzzle - 1 },
    (v, i) => `    // await puzzle${i + 1}.run();`
).join('\n')}
    await puzzle${nextPuzzle}.run({ 
        example: true, 
        mainProblem: false 
    });
}

start();
`
);
