export function uniq<T>(array: T[]) {
    const set = new Set<T>();
    array.forEach((item) => {
        set.add(item);
    });
    return [...set];
}
