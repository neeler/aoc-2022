import { readFileSync } from 'fs';
import path from 'path';
import { Puzzle } from '~/Puzzle';

const inputData = readFileSync(path.join(__dirname, './data/puzzle1.txt'), {
    encoding: 'utf-8',
}).trim();
const elfCalories = inputData
    .replace(/\s/g, ',')
    .split(',,')
    .map((stringGroup) =>
        stringGroup
            .split(',')
            .map((s) => parseInt(s, 10))
            .reduce((sum, calories) => sum + calories, 0)
    );

export const puzzle1 = new Puzzle({
    day: 1,
    part1: () => {
        const maxCalories = Math.max(...elfCalories);
        return `${maxCalories} calories`;
    },
    part2: () => {
        const sortedCalories = elfCalories.slice().sort((a, b) => b - a);
        return `${sortedCalories
            .slice(0, 3)
            .reduce((sum, calories) => sum + calories, 0)} calories`;
    },
});
