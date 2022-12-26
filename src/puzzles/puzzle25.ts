import { Puzzle } from './Puzzle';

const digits = [2, 1, 0, -1, -2];
const digitStrings: Record<string, string> = {
    2: '2',
    1: '1',
    0: '0',
    '-1': '-',
    '-2': '=',
};

class SnafuNumber {
    private value = 0;

    constructor({ string, decimal }: { string?: string; decimal?: number }) {
        if (decimal) {
            this.value = decimal;
            return;
        }
        if (!string) {
            throw new Error('Invalid SNAFU value');
        }
        this.value = SnafuNumber.parse(string);
    }

    static parse(string: string) {
        let value = 0;
        const chars = string.split('');
        const values: number[] = [];
        for (const char of chars) {
            if (char === '=') {
                values.unshift(-2);
            } else if (char === '-') {
                values.unshift(-1);
            } else {
                values.unshift(Number.parseInt(char, 10));
            }
        }
        let mult = 1;
        for (const v of values) {
            value += v * mult;
            mult *= 5;
        }
        return value;
    }

    toValue() {
        return this.value;
    }

    toString() {
        let totalLeft = this.value;
        const places: string[] = [];

        while (totalLeft !== 0) {
            const digit = digits.find((d) => {
                return (totalLeft - d) % 5 === 0;
            });
            if (digit === undefined) {
                throw new Error(`No digit found for ${totalLeft}`);
            }
            places.unshift(digitStrings[digit.toString()]);
            totalLeft = Math.round(totalLeft - digit) / 5;
        }

        return places.join('');
    }
}

export const puzzle25 = new Puzzle({
    day: 25,
    processFile: (fileData) =>
        fileData
            .trim()
            .split('\n')
            .map((string) => new SnafuNumber({ string })),
    part1: (numbers) => {
        return new SnafuNumber({
            decimal: numbers.reduce((sum, n) => sum + n.toValue(), 0),
        }).toString();
    },
    part2: (data) => {
        //
    },
});
