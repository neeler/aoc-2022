import { Puzzle } from './Puzzle';

export const puzzle1 = new Puzzle({
    day: 1,
    processFile: (fileData) =>
        fileData
            .replace(/\s/g, ',')
            .split(',,')
            .map((stringGroup) =>
                stringGroup
                    .split(',')
                    .map((s) => parseInt(s, 10))
                    .reduce((sum, calories) => sum + calories, 0)
            ),
    part1: (calories) => {
        const maxCalories = Math.max(...calories);
        return `${maxCalories} calories`;
    },
    part2: (calories) => {
        const sortedCalories = calories.slice().sort((a, b) => b - a);
        return `${sortedCalories
            .slice(0, 3)
            .reduce((sum, calories) => sum + calories, 0)} calories`;
    },
});
