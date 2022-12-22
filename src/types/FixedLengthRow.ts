export type FixedLengthRow<T extends any, L extends number> = Array<T> & {
    0: T;
    length: L;
};
