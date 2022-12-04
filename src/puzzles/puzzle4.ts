import { Puzzle } from './Puzzle';

interface AssignmentAnalysis {
    min: number;
    max: number;
    sections: number[];
    sectionMap: Record<string, boolean>;
}

interface PairAnalysis {
    elf1: AssignmentAnalysis;
    elf2: AssignmentAnalysis;
}

function analyzeAssigment(assignment: string): AssignmentAnalysis {
    const [min, max] = assignment
        .split('-')
        .map((section) => parseInt(section, 10));
    const sections = Array.from({ length: max - min + 1 }, (v, i) => i + min);
    return {
        min,
        max,
        sections,
        sectionMap: sections.reduce((map, section) => {
            map[section] = true;
            return map;
        }, {} as Record<string, boolean>),
    };
}

export const puzzle4 = new Puzzle({
    day: 4,
    processFile: (fileData): PairAnalysis[] =>
        fileData
            .trim()
            .split(/\s/)
            .map((pair) => {
                const [elf1, elf2] = pair.split(',') as [string, string];
                return {
                    elf1: analyzeAssigment(elf1),
                    elf2: analyzeAssigment(elf2),
                };
            }),
    part1: (pairs) => {
        const containedPairs = pairs.filter(
            (pair) =>
                pair.elf1.sections.every(
                    (section) => pair.elf2.sectionMap[section]
                ) ||
                pair.elf2.sections.every(
                    (section) => pair.elf1.sectionMap[section]
                )
        );
        return containedPairs.length;
    },
    part2: (pairs) => {
        const overlappingPairs = pairs.filter(
            (pair) =>
                pair.elf1.sections.some(
                    (section) => pair.elf2.sectionMap[section]
                ) ||
                pair.elf2.sections.some(
                    (section) => pair.elf1.sectionMap[section]
                )
        );
        return overlappingPairs.length;
    },
});
