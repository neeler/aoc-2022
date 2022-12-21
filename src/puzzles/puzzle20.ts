import { Puzzle } from './Puzzle';

class WrappedNumber {
    value: number;
    id: string;

    constructor(value: number, originalIndex: number) {
        this.value = value;
        this.id = WrappedNumber.getId(value, originalIndex);
    }

    static getId(value: number, originalIndex: number) {
        return `${originalIndex}-${value}`;
    }
}

class Sequence {
    originalNumbers: number[];
    numbers: WrappedNumber[];
    numbersById: Record<string, WrappedNumber> = {};
    indexes: Record<string, number> = {};
    zero: WrappedNumber;
    moduloBuffer: number;

    constructor(
        numbers: number[],
        {
            decryptionKey,
            nMixes = 1,
        }: { decryptionKey?: number; nMixes?: number } = {}
    ) {
        this.originalNumbers =
            decryptionKey === undefined
                ? numbers.slice()
                : numbers.map((n) => n * decryptionKey);
        this.numbers = this.originalNumbers.map(
            (number, index) => new WrappedNumber(number, index)
        );
        this.updateCache();
        const zero = this.numbers.find((number) => number.value === 0);
        if (!zero) {
            throw new Error('No zero found');
        }
        this.zero = zero;
        const minNumber = Math.min(...this.originalNumbers);
        this.moduloBuffer =
            Math.ceil(-minNumber / this.originalNumbers.length) *
            this.originalNumbers.length;

        for (let i = 0; i < nMixes; i++) {
            console.log(`Mix ${i + 1}`);
            this.mix();
        }
    }

    private updateCache() {
        this.numbers.forEach((number, index) => {
            this.indexes[number.id] = index;
            this.numbersById[number.id] = number;
        });
    }

    private getNumberById(value: number, originalIndex: number) {
        return this.numbersById[WrappedNumber.getId(value, originalIndex)];
    }

    private mix() {
        for (let i = 0; i < this.originalNumbers.length; i++) {
            const target = this.getNumberById(this.originalNumbers[i], i);
            if (target.value !== 0) {
                const currentIndex = this.indexes[target.id];

                const isNegative = target.value < 0;
                let indexBeforeMod =
                    currentIndex + target.value + (isNegative ? 0 : 1);
                const nWrapsAround = Math.floor(
                    Math.abs(target.value / (this.numbers.length - 1))
                );
                const firstIndexAfter =
                    (indexBeforeMod +
                        this.moduloBuffer +
                        nWrapsAround * (isNegative ? -1 : 1)) %
                    this.numbers.length;
                const newNumbers = [target];
                for (let i = 0; i < this.originalNumbers.length; i++) {
                    const number = this.getRelativeIndexedNumber(
                        firstIndexAfter,
                        i
                    );
                    if (number.id !== target.id) {
                        newNumbers.push(number);
                    }
                }
                this.numbers = newNumbers;
                this.updateCache();
            }
        }
    }

    calculateCoordinates() {
        return (
            this.getZeroIndexedValueAt(1000) +
            this.getZeroIndexedValueAt(2000) +
            this.getZeroIndexedValueAt(3000)
        );
    }

    private getRelativeIndexedNumber(
        startIndex: number,
        relativeIndex: number
    ) {
        return this.numbers[
            (startIndex + relativeIndex + this.moduloBuffer) %
                this.numbers.length
        ];
    }

    private getZeroIndexedValueAt(relativeIndex: number) {
        const zeroIndex = this.indexes[this.zero.id];
        return this.numbers[
            (zeroIndex + relativeIndex + this.numbers.length) %
                this.numbers.length
        ].value;
    }
}

export const puzzle20 = new Puzzle({
    day: 20,
    processFile: (fileData) =>
        fileData.split('\n').reduce((numbers, n) => {
            if (n) numbers.push(parseInt(n, 10));
            return numbers;
        }, Array<number>()),
    part1: (numbers) => new Sequence(numbers).calculateCoordinates(),
    part2: (numbers) =>
        new Sequence(numbers, {
            decryptionKey: 811589153,
            nMixes: 10,
        }).calculateCoordinates(),
});
