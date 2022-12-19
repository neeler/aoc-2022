export function numbersBetween(min: number, max: number) {
    return Array.from(
        {
            length: max - min + 1,
        },
        (v, i) => i + min
    );
}
