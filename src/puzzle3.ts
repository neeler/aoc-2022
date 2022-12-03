import { Puzzle } from '~/Puzzle';

interface ItemGroupAnalysis {
    items: string[];
    quantities: Record<string, number>;
}

interface RuckSackAnalysis {
    compartment1: ItemGroupAnalysis;
    compartment2: ItemGroupAnalysis;
    total: ItemGroupAnalysis;
}

function getPriority(item: string): number {
    const lowerCasedItem = item.toLowerCase();
    if (lowerCasedItem === item) {
        const charCode = item.charCodeAt(0);
        return charCode - 'a'.charCodeAt(0) + 1;
    }
    return getPriority('z') + getPriority(lowerCasedItem);
}

function sumItemPriorites(itemTypes: (string | undefined)[]) {
    return itemTypes.reduce(
        (sum, itemType) => sum + (itemType ? getPriority(itemType) : 0),
        0
    );
}

function findCommonItemType(...groups: ItemGroupAnalysis[]) {
    const [firstGroup, ...otherGroups] = groups;
    if (!firstGroup) {
        return undefined;
    }
    return Object.keys(firstGroup.quantities).find((itemType) =>
        otherGroups.every((group) => group.quantities[itemType])
    );
}

function analyzeCompartment(compartment: string): ItemGroupAnalysis {
    const items = compartment.split('');
    return {
        items,
        quantities: items.reduce((byItem, item) => {
            byItem[item] = (byItem[item] ?? 0) + 1;
            return byItem;
        }, {} as Record<string, number>),
    };
}

export const puzzle3 = new Puzzle({
    day: 3,
    processFile: (fileData): RuckSackAnalysis[] =>
        fileData
            .trim()
            .split(/\s/)
            .map((row) => {
                const compartment1 = analyzeCompartment(
                    row.slice(0, row.length / 2)
                );
                const compartment2 = analyzeCompartment(
                    row.slice(row.length / 2)
                );
                const total = analyzeCompartment(row);
                return {
                    compartment1,
                    compartment2,
                    total,
                };
            }),
    part1: (rucksacks) => {
        const misplacedItems = rucksacks.map(({ compartment1, compartment2 }) =>
            findCommonItemType(compartment1, compartment2)
        );
        return sumItemPriorites(misplacedItems);
    },
    part2: (rucksacks) => {
        const elfGroups = Array.from(
            { length: Math.floor(rucksacks.length / 3) },
            (v, i) =>
                rucksacks.slice(i * 3, (i + 1) * 3) as [
                    RuckSackAnalysis,
                    RuckSackAnalysis,
                    RuckSackAnalysis
                ]
        );
        const badgeTypes = elfGroups.map((rucksacks) =>
            findCommonItemType(...rucksacks.map((rs) => rs.total))
        );
        return sumItemPriorites(badgeTypes);
    },
});
