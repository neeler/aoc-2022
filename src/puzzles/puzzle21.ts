import { Puzzle } from './Puzzle';

interface MonkeyConfig {
    id: string;
    formula: string;
    monkeysById: Record<string, Monkey>;
}

class Monkey {
    id: string;
    monkeysById: Record<string, Monkey>;
    fixedValue: number | undefined;
    isFixed: boolean;
    linkId1?: string;
    private operator?: string;
    linkId2?: string;
    getValue: () => number;
    formula?: (v1: number, v2: number) => number;

    constructor({ id, formula, monkeysById }: MonkeyConfig) {
        this.id = id;
        this.monkeysById = monkeysById;

        const number = parseInt(formula, 10);
        if (Number.isNaN(number)) {
            const [, id1, operator, id2] =
                formula.match(/(\w*) ([/+*-]) (\w*)/) ?? [];
            if (!(id1 && operator && id2)) {
                throw new Error(`Formula parsing error for "${formula}"`);
            }
            this.isFixed = false;
            this.linkId1 = id1;
            this.operator = operator;
            this.linkId2 = id2;
            const formulaFn = (value1: number, value2: number) => {
                switch (operator) {
                    case '+': {
                        return value1 + value2;
                    }
                    case '-': {
                        return value1 - value2;
                    }
                    case '*': {
                        return value1 * value2;
                    }
                    case '/': {
                        return Math.round(value1 / value2);
                    }
                    default: {
                        throw new Error(`Unknown operator ${operator}`);
                    }
                }
            };
            this.formula = formulaFn;
            this.getValue = () =>
                formulaFn(
                    this.monkeysById[id1].getValue(),
                    this.monkeysById[id2].getValue()
                );
        } else {
            this.isFixed = true;
            this.fixedValue = number;
            this.getValue = () => number;
        }
    }

    simplify() {
        if (
            this.fixedValue !== undefined ||
            !(this.linkId1 && this.linkId2 && this.formula)
        ) {
            return false;
        }

        const monkey1 = this.monkeysById[this.linkId1];
        const monkey2 = this.monkeysById[this.linkId2];

        if (monkey1?.isFixed && monkey2?.isFixed) {
            this.fixedValue = this.formula(
                monkey1.fixedValue as number,
                monkey2.fixedValue as number
            );
            this.isFixed = true;
            return true;
        }

        return false;
    }

    logFormula(): string {
        if (this.isFixed) {
            return (this.fixedValue as number).toString();
        }

        if (!(this.linkId1 && this.linkId2)) {
            throw new Error('No link found!');
        }

        return `(${this.monkeysById[this.linkId1]?.logFormula() ?? 'human'} ${
            this.operator
        } ${this.monkeysById[this.linkId2]?.logFormula() ?? 'human'})`;
    }

    solveAt(target: number, valuesById: Record<string, number> = {}) {
        let updatedState = {
            ...valuesById,
            [this.id]: target,
        };
        if (this.isFixed || !(this.linkId1 && this.linkId2)) {
            return updatedState;
        }

        this.isFixed = true;
        this.fixedValue = target;

        let value1 = valuesById[this.linkId1];
        const monkey1 = this.monkeysById[this.linkId1] as Monkey | undefined;
        let value2 = valuesById[this.linkId2];
        const monkey2 = this.monkeysById[this.linkId2] as Monkey | undefined;

        if (value1 !== undefined) {
            switch (this.operator) {
                case '+': {
                    value2 = target - value1;
                    break;
                }
                case '-': {
                    value2 = value1 - target;
                    break;
                }
                case '*': {
                    value2 = target / value1;
                    break;
                }
                case '/': {
                    value2 = Math.round(value1 / target);
                    break;
                }
                default: {
                    throw new Error(`Unknown operator ${this.operator}`);
                }
            }
            if (monkey2) {
                updatedState = monkey2.solveAt(value2, updatedState);
            }
        }
        if (value2 !== undefined) {
            switch (this.operator) {
                case '+': {
                    value1 = target - value2;
                    break;
                }
                case '-': {
                    value1 = value2 + target;
                    break;
                }
                case '*': {
                    value1 = Math.round(target / value2);
                    break;
                }
                case '/': {
                    value1 = target * value2;
                    break;
                }
                default: {
                    throw new Error(`Unknown operator ${this.operator}`);
                }
            }
            if (monkey1) {
                updatedState = monkey1.solveAt(value1, updatedState);
            }
        }

        updatedState[this.linkId1] = value1;
        updatedState[this.linkId2] = value2;

        return updatedState;
    }
}

export const puzzle21 = new Puzzle({
    day: 21,
    processFile: (fileData) =>
        fileData
            .trim()
            .split('\n')
            .filter((s) => s),
    part1: (monkeyData) => {
        const monkeysById: Record<string, Monkey> = {};
        let root: Monkey | undefined;
        monkeyData.forEach((directive) => {
            const [id, formula] = directive.split(': ');
            monkeysById[id] = new Monkey({
                id,
                formula,
                monkeysById,
            });
            if (id === 'root') {
                root = monkeysById[id];
            }
        });
        if (!root) {
            throw new Error('Root monkey not found');
        }
        return root.getValue();
    },
    part2: (monkeyData) => {
        const monkeysById: Record<string, Monkey> = {};
        const parentsById: Record<string, Monkey> = {};
        const monkeys: Monkey[] = [];
        let checkId1: string | undefined;
        let checkId2: string | undefined;
        monkeyData.forEach((directive) => {
            const [id, formula] = directive.split(': ');
            if (id === 'humn') return;

            if (id === 'root') {
                const [, id1, , id2] =
                    formula.match(/(\w*) ([/+*-]) (\w*)/) ?? [];
                checkId1 = id1;
                checkId2 = id2;
            } else {
                const monkey = new Monkey({
                    id,
                    formula,
                    monkeysById,
                });
                monkeysById[id] = monkey;
                monkeys.push(monkey);
            }
        });

        monkeys.forEach((monkey) => {
            if (monkey.linkId1) {
                parentsById[monkey.linkId1] = monkey;
            }
            if (monkey.linkId2) {
                parentsById[monkey.linkId2] = monkey;
            }
        });

        // Solve any monkeys that are not related to you
        while (monkeys.some((monkey) => monkey.simplify())) {}

        if (!(checkId1 && checkId2)) {
            throw new Error('Root monkey not found');
        }

        const checkMonkey1 = monkeysById[checkId1];
        const checkMonkey2 = monkeysById[checkId2];

        let unsolved = Array<Monkey>();
        let initialState: Record<string, number> = {};
        monkeys.forEach((monkey) => {
            if (monkey.isFixed) {
                initialState[monkey.id] = monkey.fixedValue as number;
            } else {
                unsolved.push(monkey);
            }
        });

        const target = (
            checkMonkey1.isFixed
                ? checkMonkey1.fixedValue
                : checkMonkey2.fixedValue
        ) as number;
        const variableMonkey = checkMonkey1.isFixed
            ? checkMonkey2
            : checkMonkey1;

        initialState = variableMonkey.solveAt(target, initialState);

        unsolved = unsolved.filter((monkey) => !monkey.isFixed);
        monkeys.forEach((monkey) => {
            if (initialState[monkey.id] !== undefined) {
                initialState = monkey.solveAt(
                    initialState[monkey.id],
                    initialState
                );
            }
        });

        return initialState.humn;
    },
});
