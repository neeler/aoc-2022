export function cartesianProduct<TData>(...arrays: TData[][]) {
    return arrays.reduce(
        (a, b) => a.map((x) => b.map((y) => x.concat([y]))).flat(),
        [Array<TData>()]
    );
}
