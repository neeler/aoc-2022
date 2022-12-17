export function getAllPossiblePartitions<T>(items: T[]): [T[], T[]][] {
    if (items.length < 2) {
        return [[items, []]];
    }
    const firstItem = items[0] as T;
    const partitionsOfRest = getAllPossiblePartitions(items.slice(1));
    return partitionsOfRest.reduce((partitions, [groupA, groupB]) => {
        partitions.push([groupA.concat(firstItem), groupB]);
        partitions.push([groupB.concat(firstItem), groupA]);
        return partitions;
    }, Array<[T[], T[]]>());
}
