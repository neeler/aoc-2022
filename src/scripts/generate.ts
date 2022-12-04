import { writeFileSync, readdirSync } from 'fs';
import path from 'path';

const dataFolder = path.join(__dirname, '../data');
const puzzleFolder = path.join(__dirname, '../');

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
    `import { Puzzle } from '~/Puzzle';

export const puzzle${nextPuzzle} = new Puzzle({
    day: ${nextPuzzle},
    processFile: (fileData) => fileData.split('\\n'),
    part1: (data) => {
        //
    },
    part2: (data) => {
        //
    },
});
`
);
