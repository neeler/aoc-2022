import { findAllPairs } from '~/util/findAllPairs';

export interface Range {
    min: number;
    max: number;
}

export function collapseRanges(ranges: Range[]): Range[] {
    if (ranges.length < 2) {
        return ranges;
    }

    let newRanges = [...ranges];
    let pairs = findAllPairs(newRanges);
    let potentialOptimization = findOptimization(pairs);

    while (potentialOptimization) {
        const { range1, range2, combined } = potentialOptimization;

        newRanges = [
            combined[0],
            ...newRanges.filter((r) => r !== range1 && r !== range2),
        ];
        pairs = findAllPairs(newRanges);
        potentialOptimization = findOptimization(pairs);
    }

    return newRanges;
}

function combineRanges(range1: Range, range2: Range): Range[] {
    if (
        numberIsInRange(range1.min, range2) ||
        numberIsInRange(range1.max, range2) ||
        numberIsInRange(range2.min, range1) ||
        numberIsInRange(range2.max, range1)
    ) {
        return [
            {
                min: Math.min(range1.min, range2.min),
                max: Math.max(range1.max, range2.max),
            },
        ];
    }
    return [range1, range2];
}

function numberIsInRange(number: number, range: Range) {
    return number >= range.min && number <= range.max;
}

function findOptimization(pairsOfRanges: [Range, Range][]) {
    for (const [range1, range2] of pairsOfRanges) {
        const combined = combineRanges(range1, range2);
        if (combined.length < 2) {
            return {
                range1,
                range2,
                combined,
            };
        }
    }
    return undefined;
}
