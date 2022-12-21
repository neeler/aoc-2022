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
    logs: string[] = [];
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
        // console.log(
        //     this.numbers
        //         .map((n) => n.value.toString().padStart(2, ' '))
        //         .join(',')
        // );
        this.logs.push(this.logString);
        for (let i = 0; i < nMixes; i++) {
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
            console.log(`${i} / ${this.originalNumbers.length}`);
            const target = this.getNumberById(this.originalNumbers[i], i);
            if (target.value !== 0) {
                const currentIndex = this.indexes[target.id];

                const isNegative = target.value < 0;
                let indexBeforeMod =
                    currentIndex + target.value + (isNegative ? 0 : 1);
                const nWrapsAround = Math.floor(
                    Math.abs(target.value / this.numbers.length)
                );
                // if (isNegative && indexBeforeMod > currentIndex) {
                //     indexBeforeMod += -1 + this.numbers.length;
                // } else if (!isNegative) {
                //     indexBeforeMod++;
                // }
                const firstIndexAfter =
                    (indexBeforeMod +
                        this.moduloBuffer +
                        nWrapsAround * (isNegative ? -1 : 1)) %
                    this.numbers.length;
                // console.log({
                //     target: target.value,
                //     currentIndex,
                //     firstIndexAfter,
                // });
                const newNumbers = [target];
                for (let i = 0; i < this.originalNumbers.length; i++) {
                    const number = this.getRelativeIndexedNumber(
                        firstIndexAfter,
                        i
                    );
                    if (number.id !== target.id) {
                        // if (!i) {
                        //     console.log('first number after', number.value);
                        // }
                        newNumbers.push(number);
                    }
                }
                // console.log(
                //     target.value,
                //     newNumbers
                //         .map((n) => n.value.toString().padStart(2, ' '))
                //         .join(',')
                // );
                this.numbers = newNumbers;
                this.updateCache();

                //                 this.logs.push(this.logString);
                //
                const slowSequence = new SlowSequence(this.originalNumbers);
                const coordsToCompare = slowSequence.getCoordinatesAt(i);
                if (this.logString !== slowSequence.logString) {
                    console.log({
                        move: i + 1,
                        number: target.value,
                        // numbers: this.numbers.map((n) => n.value).join(','),
                        // numbersBefore: numbersBefore.map((n) => n.value).join(','),
                        // numbersAfter: numbersAfter.map((n) => n.value).join(','),
                        currentIndex,
                        firstIndexAfter,
                        isNegative,
                        nWrapsAround,
                    });
                    console.log(
                        `
                fast${i + 1}: ${this.logString}
                slow${i + 1}: ${slowSequence.logString}`
                    );
                    throw new Error(`Panic! Difference found at move ${i + 1}`);
                }
            }
        }
    }

    calculateCoordinates() {
        // console.log([
        //     this.getZeroIndexedValueAt(1000),
        //     this.getZeroIndexedValueAt(2000),
        //     this.getZeroIndexedValueAt(3000),
        // ]);
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

    private getZeroIndexedNumber(relativeIndex: number) {
        const zeroIndex = this.indexes[this.zero.id];
        return this.numbers[
            (zeroIndex + relativeIndex + this.numbers.length) %
                this.numbers.length
        ];
    }

    private getZeroIndexedValueAt(relativeIndex: number) {
        return this.getZeroIndexedNumber(relativeIndex).value;
    }

    get logString() {
        return this.numbers
            .map((_, i) => this.getZeroIndexedValueAt(i))
            .join(',');
    }

    log() {
        console.log(`
fast: ${this.logString}
      ${this.numbers.map((n) => n.value)}`);
    }
}

export const puzzle20 = new Puzzle({
    day: 20,
    processFile: (fileData) =>
        fileData.split('\n').reduce((numbers, n) => {
            if (n) numbers.push(parseInt(n, 10));
            return numbers;
        }, Array<number>()),
    part1: (numbers) => {
        // const slowSequence = new SlowSequence(numbers);
        // slowSequence.getCoordinatesAt();
        // return slowSequence.calculateCoordinates();
        return new Sequence(numbers).calculateCoordinates();
    },
    // skipPart2: true,
    part2: (numbers) =>
        new Sequence(numbers, {
            decryptionKey: 811589153,
            nMixes: 10,
        }).calculateCoordinates(),
});

class SlowSequence {
    originalNumbers: number[];
    numbers: WrappedNumber[];
    numbersById: Record<string, WrappedNumber> = {};
    indexes: Record<string, number> = {};
    zero: WrappedNumber;
    logs: string[] = [];

    constructor(numbers: number[]) {
        this.originalNumbers = numbers.slice();
        this.numbers = numbers.map(
            (number, index) => new WrappedNumber(number, index)
        );
        this.numbers.forEach((number, index) => {
            this.indexes[number.id] = index;
            this.numbersById[number.id] = number;
        });
        const zero = this.numbers.find((number) => number.value === 0);
        if (!zero) {
            throw new Error('No zero found');
        }
        this.zero = zero;
    }

    getNumberById(value: number, originalIndex: number) {
        return this.numbersById[WrappedNumber.getId(value, originalIndex)];
    }

    getCoordinatesAt(iMix = this.originalNumbers.length - 1) {
        // this.log();
        for (let i = 0; i <= iMix; i++) {
            const target = this.getNumberById(this.originalNumbers[i], i);
            //             console.log(`
            // moving ${target.value}`);
            const iterations = Math.abs(target.value);
            const isNegative = target.value < 0;
            for (let i = 0; i < iterations; i++) {
                const currentIndex = this.indexes[target.id];
                const targetIndex =
                    (isNegative
                        ? this.numbers.length + currentIndex - 1
                        : currentIndex + 1) % this.numbers.length;
                const numberAtTarget = this.numbers[targetIndex];
                this.numbers[currentIndex] = numberAtTarget;
                this.indexes[numberAtTarget.id] = currentIndex;
                this.numbers[targetIndex] = target;
                this.indexes[target.id] = targetIndex;

                // this.log();
                // console.log(`slow${i + 1}: ${this.logString}`);
            }
        }
        return this.calculateCoordinates();
    }

    calculateCoordinates() {
        return (
            this.getZeroIndexedValueAt(1000) +
            this.getZeroIndexedValueAt(2000) +
            this.getZeroIndexedValueAt(3000)
        );
    }

    private getZeroIndexedValueAt(relativeIndex: number) {
        const zeroIndex = this.indexes[this.zero.id];
        const index =
            this.numbers[
                (zeroIndex + relativeIndex + this.numbers.length) %
                    this.numbers.length
            ];
        return index.value;
    }

    get logString() {
        return this.numbers
            .map((_, i) => this.getZeroIndexedValueAt(i))
            .join(',');
    }

    log() {
        console.log(`slow: ${this.logString}`);
    }
}
