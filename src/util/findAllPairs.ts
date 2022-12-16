export function findAllPairs<TData>(items: TData[]) {
    return items.reduce((pairs, item, index) => {
        items.slice(index + 1).forEach((otherItem) => {
            pairs.push([item, otherItem]);
        });
        return pairs;
    }, Array<[TData, TData]>());
}
