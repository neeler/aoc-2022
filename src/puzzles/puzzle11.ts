import { Puzzle } from './Puzzle';

interface MonkeyConfig {
    index: number;
    items: number[];
    operation: string;
    testDivisor: number;
    trueTarget: number;
    falseTarget: number;
}

class Monkey {
    index: number;
    items: number[];
    nItemsInspected = 0;
    operate: (worry: number) => bigint;
    operation: string;
    private readonly modulo: number;

    constructor(
        readonly config: MonkeyConfig & {
            monkeys: Monkey[];
            modulo: number;
        }
    ) {
        const { index, items, operation, modulo } = config;
        this.index = index;
        this.operate = parseOperation(operation);
        this.operation = operation;
        this.items = items.slice();
        this.modulo = modulo;
    }

    testItem(worry: number) {
        const targetMonkey =
            this.config.monkeys[
                worry % this.config.testDivisor === 0
                    ? this.config.trueTarget
                    : this.config.falseTarget
            ];
        if (!targetMonkey) {
            throw new Error(`Target Monkey ${targetMonkey} not found`);
        }
        return targetMonkey;
    }

    inspectItems({ reliefFactor }: { reliefFactor: number }) {
        let item = this.items.shift();

        while (item !== undefined) {
            this.nItemsInspected += 1;

            item = Number(
                (this.operate(item) / BigInt(reliefFactor)) %
                    BigInt(this.modulo)
            );

            const targetMonkey = this.testItem(item);
            targetMonkey.catchItem(item);

            item = this.items.shift();
        }
    }

    catchItem(item: number) {
        this.items.push(item);
    }
}

function runRounds({
    monkeys,
    nRounds,
    reliefFactor,
}: {
    monkeys: Monkey[];
    nRounds: number;
    reliefFactor: number;
}) {
    console.log(`
------- Running ${nRounds} rounds.... -------
`);
    for (let iRound = 0; iRound < nRounds; iRound++) {
        monkeys.forEach((monkey) => {
            monkey.inspectItems({ reliefFactor });
        });
    }
    console.log(
        monkeys
            .map(
                (monkey) =>
                    `Monkey ${monkey.index} inspected items ${monkey.nItemsInspected} times.`
            )
            .join('\n')
    );
}

function calculateMonkeyBusiness(monkeys: Monkey[]) {
    monkeys.map((m) => m.nItemsInspected).sort();
    return monkeys
        .map((m) => m.nItemsInspected)
        .sort((a, b) => b - a)
        .slice(0, 2)
        .reduce(
            (monkeyBusiness, nItemsInspected) =>
                monkeyBusiness * nItemsInspected,
            1
        );
}

function operate(value1: number, operator: string, value2: number) {
    switch (operator) {
        case '*': {
            return BigInt(value1) * BigInt(value2);
        }
        case '-': {
            return BigInt(value1) - BigInt(value2);
        }
        case '/': {
            return BigInt(value1) / BigInt(value2);
        }
        case '+': {
            return BigInt(value1) + BigInt(value2);
        }
        default: {
            throw new Error(`Unknown operator "${operator}"`);
        }
    }
}

function parseOperation(operation: string) {
    const [part1, operator, part2] = operation.split(' ');
    return (worry: number) => {
        const value1 = part1 === 'old' ? worry : parseInt(part1, 10);
        const value2 = part2 === 'old' ? worry : parseInt(part2, 10);
        return operate(value1, operator, value2);
    };
}

export const puzzle11 = new Puzzle({
    day: 11,
    processFile: (fileData) => {
        const lines = fileData.trim().split('\n');
        const nMonkeys = (lines.length + 1) / 7;
        const monkeysConfig = Array<MonkeyConfig>();
        for (let i = 0; i < nMonkeys; i++) {
            const [
                titleLine,
                itemsLine,
                operationLine,
                testLine,
                trueLine,
                falseLine,
            ] = lines.slice(i * 7);

            monkeysConfig.push({
                index: parseInt(titleLine.match(/Monkey (\d*)/)?.[1] ?? '', 10),
                items: (itemsLine.match(/items: (.*)/)?.[1] ?? '')
                    .split(',')
                    .map((item) => parseInt(item, 10)),
                operation:
                    operationLine.match(/Operation: new = (.*)/)?.[1] ?? '',
                testDivisor: parseInt(
                    testLine.match(/divisible by (\d*)/)?.[1] ?? '',
                    10
                ),
                trueTarget: parseInt(
                    trueLine.match(/throw to monkey (\d*)/)?.[1] ?? '',
                    10
                ),
                falseTarget: parseInt(
                    falseLine.match(/throw to monkey (\d*)/)?.[1] ?? '',
                    10
                ),
            });
        }
        return {
            monkeysConfig,
            modulo: monkeysConfig.reduce(
                (mod, monkey) => mod * monkey.testDivisor,
                1
            ),
        };
    },
    part1: ({ monkeysConfig, modulo }) => {
        const monkeys = monkeysConfig.reduce((monkeysSoFar, config) => {
            monkeysSoFar.push(
                new Monkey({
                    ...config,
                    modulo,
                    monkeys: monkeysSoFar,
                })
            );
            return monkeysSoFar;
        }, Array<Monkey>());
        runRounds({
            monkeys,
            nRounds: 20,
            reliefFactor: 3,
        });
        return calculateMonkeyBusiness(monkeys);
    },
    part2: ({ monkeysConfig, modulo }) => {
        const monkeys = monkeysConfig.reduce((monkeysSoFar, config) => {
            monkeysSoFar.push(
                new Monkey({
                    ...config,
                    modulo,
                    monkeys: monkeysSoFar,
                })
            );
            return monkeysSoFar;
        }, Array<Monkey>());
        runRounds({
            monkeys,
            nRounds: 10000,
            reliefFactor: 1,
        });
        return calculateMonkeyBusiness(monkeys);
    },
});
