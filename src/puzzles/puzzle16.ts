import { getAllPossiblePartitions } from '~/util/getAllPossiblePartitions';
import { Puzzle } from './Puzzle';

class Valve {
    name: string;
    flowRate: number;
    neighborNames: string[];
    neighbors: Valve[] = [];
    valvesByName: Record<string, Valve>;
    distancesByName: Record<string, number> = {};

    constructor({
        description,
        valvesByName,
    }: {
        description: string;
        valvesByName: Record<string, Valve>;
    }) {
        const [, name, rate, , neighbors] =
            description.match(
                /^Valve (\w*) has flow rate=(\d*); (tunnels lead|tunnel leads) to valves? (.*)$/
            ) ?? [];
        if (!name) {
            throw new Error('No valve name');
        }
        this.name = name;
        this.flowRate = parseInt(rate, 10);
        if (Number.isNaN(this.flowRate)) {
            throw new Error(`Invalid flow rate ${rate}`);
        }

        this.neighborNames = neighbors.split(', ');
        this.valvesByName = valvesByName;
    }

    initLinks() {
        this.neighbors = this.neighborNames.map(
            (name) => this.valvesByName[name]
        );
    }

    getDistance(valveName: string) {
        return this.distancesByName[valveName] ?? 0;
    }

    calculateDistances() {
        this.distancesByName[this.name] = 0;

        // Walk and score
        const valvesToWalk: Valve[] = [this];
        while (valvesToWalk.length) {
            const valve = valvesToWalk.shift();
            if (valve) {
                const newValue = this.getDistance(valve.name) + 1;
                valve.neighbors.forEach((neighbor) => {
                    if (
                        neighbor.name !== this.name &&
                        (this.distancesByName[neighbor.name] === undefined ||
                            this.getDistance(neighbor.name) > newValue)
                    ) {
                        this.distancesByName[neighbor.name] = newValue;
                        valvesToWalk.push(neighbor);
                    }
                });
            }
        }
    }
}

function parsePuzzleData(fileData: string, valvesToConsider?: string[]) {
    let startingValve: Valve | undefined;
    const valvesByName: Record<string, Valve> = {};
    const valves = fileData
        .trim()
        .split('\n')
        .filter((description) => description)
        .map((description) => {
            const valve = new Valve({ description, valvesByName });
            valvesByName[valve.name] = valve;
            if (valve.name === 'AA') {
                startingValve = valve;
            }
            return valve;
        });
    valves.forEach((valve) => valve.initLinks());
    valves.forEach((valve) => valve.calculateDistances());
    let sortedValves = valves
        .slice()
        .sort((a, b) => b.flowRate - a.flowRate)
        .filter((v) => v.flowRate)
        .map((v) => v.name);
    if (!startingValve) {
        throw new Error('No starting valve found');
    }
    if (valvesToConsider) {
        valves.forEach((valve) => {
            if (!valvesToConsider.includes(valve.name)) {
                valve.flowRate = 0;
            }
        });
        sortedValves = sortedValves.filter((v) => valvesByName[v].flowRate);
    }
    return {
        sortedValves,
        valvesByName,
        startingValve,
    };
}

interface PuzzleData {
    sortedValves: string[];
    valvesByName: Record<string, Valve>;
    startingValve: Valve;
}

function calculateBestScore({
    timeLimit,
    sortedValves,
    valvesByName,
    startingValve,
    minutesToAdd = 0,
}: PuzzleData & {
    timeLimit: number;
    minutesToAdd?: number;
}) {
    const startingId = getSignature({
        valveName: startingValve.name,
        remainingRankedClosed: sortedValves,
        minute: 1,
    });
    const scoredIdsSeen: Record<string, number> = {};
    let valveQueue: QueuedStep[] = [
        {
            id: startingId,
            valveName: startingValve.name,
            previousValve: startingValve.name,
            minute: 1,
            flowRate: 0,
            pressureSum: 0,
            remainingRankedClosed: sortedValves,
            opened: [],
            steps: ['start at AA'],
        },
    ];
    let maxPressure = 0;
    let flowRateOfBest = 0;
    let bestOpened: string[] = [];
    let bestRemainingUnopened: string[] = [];
    let bestSteps: string[] = [];
    let bestFlowRates: number[] = [];
    const stopTime = timeLimit + minutesToAdd + 1;
    const addToQueue = (step: Omit<QueuedStep, 'id' | 'optimisticScore'>) => {
        const {
            previousValve,
            valveName,
            remainingRankedClosed,
            minute,
            pressureSum,
            flowRate,
            steps,
            opened,
        } = step;
        const id = getSignature({
            valveName: valveName,
            remainingRankedClosed: remainingRankedClosed,
            minute: minute,
        });
        const existingScore = scoredIdsSeen[id];
        if (existingScore === undefined || existingScore < pressureSum) {
            scoredIdsSeen[id] = pressureSum;
            const optimisticScore = getOptimisticScore({
                minutesLeft: stopTime - minute,
                pressure: pressureSum,
                flowRate,
                remainingRankedClosed,
                valvesByName,
            });
            if (optimisticScore < maxPressure) {
                return;
            }

            if (pressureSum > maxPressure) {
                maxPressure = pressureSum;
                bestRemainingUnopened = remainingRankedClosed.slice();
                bestOpened = opened;
                flowRateOfBest = flowRate;
                bestSteps = steps;
            }
            if (minute < stopTime) {
                valveQueue.push({
                    id,
                    ...step,
                });
            }
        }
    };
    while (valveQueue.length) {
        // if (valveQueue.length % 1000) {
        //     console.log(`${valveQueue.length} in queue`);
        // }
        const step = valveQueue.shift() as QueuedStep;
        const {
            valveName,
            previousValve,
            minute,
            flowRate,
            pressureSum,
            remainingRankedClosed,
            steps,
            opened,
        } = step;
        const valve = valvesByName[valveName] as Valve;

        const minutesLeft = stopTime - minute;

        addToQueue({
            ...step,
            minute: stopTime,
            pressureSum: pressureSum + flowRate * minutesLeft,
            steps: steps.concat('do nothing'),
        });
        remainingRankedClosed.forEach((targetName) => {
            if (targetName === previousValve) return;

            const distance = valve.getDistance(targetName);
            const timeToValue = distance + 1;
            if (!distance || timeToValue > minutesLeft - 1) return;

            // move to target
            addToQueue({
                valveName: targetName,
                previousValve: valveName,
                minute: minute + timeToValue,
                flowRate: flowRate + valvesByName[targetName].flowRate,
                pressureSum: pressureSum + flowRate * timeToValue,
                remainingRankedClosed: remainingRankedClosed.filter(
                    (v) => v !== targetName
                ),
                opened: opened.concat(targetName),
                steps: steps.concat(
                    `@ minute ${minute}, move to ${targetName} (${distance}), open (1) -> minute ${
                        minute + timeToValue
                    }`
                ),
            });
        });
    }
    return {
        maxPressure,
        unopened: bestRemainingUnopened,
        opened: bestOpened,
        flowRate: flowRateOfBest,
        bestSteps,
        flowRates: bestFlowRates,
    };
}

export const puzzle16 = new Puzzle({
    day: 16,
    skipPart1: true,
    skipPart2: false,
    processFile: (fileData) => fileData,
    part1: (fileData) => {
        const { maxPressure } = calculateBestScore({
            timeLimit: 30,
            ...parsePuzzleData(fileData),
        });
        return maxPressure;
    },
    part2: (fileData) => {
        const timeLimit = 26;
        const { sortedValves } = parsePuzzleData(fileData);
        const possiblePartitions = getAllPossiblePartitions(sortedValves);
        console.log(`${possiblePartitions.length} possible partitions`);

        const combos = possiblePartitions.map(
            ([group1Valves, group2Valves], index) => {
                if (index % 1000 === 0) {
                    console.log(`${index} / ${possiblePartitions.length}`);
                }
                if (
                    [group1Valves.length, group2Valves.length].some(
                        (length) => length < sortedValves.length / 2 - 2
                    )
                ) {
                    return 0;
                }
                const data1 = calculateBestScore({
                    ...parsePuzzleData(fileData, group1Valves),
                    timeLimit,
                });
                const data2 = calculateBestScore({
                    ...parsePuzzleData(fileData, group2Valves),
                    timeLimit,
                });

                const totalPressure = data1.maxPressure + data2.maxPressure;

                return totalPressure;
            }
        );

        return Math.max(...combos);
    },
});

function getSignature({
    valveName,
    remainingRankedClosed,
    minute,
}: {
    valveName: string;
    remainingRankedClosed: string[];
    minute: number;
}) {
    return `${valveName}@${minute}:${remainingRankedClosed.join(',')}`;
}

function getOptimisticScore({
    minutesLeft,
    pressure,
    flowRate,
    remainingRankedClosed,
    valvesByName,
}: {
    minutesLeft: number;
    pressure: number;
    flowRate: number;
    remainingRankedClosed: string[];
    valvesByName: Record<string, Valve>;
}) {
    return (
        pressure +
        flowRate * minutesLeft +
        remainingRankedClosed.reduce(
            (sum, valve) =>
                sum + valvesByName[valve].flowRate * (minutesLeft + 1),
            0
        )
    );
}

interface QueuedStep {
    id: string;
    valveName: string;
    previousValve: string;
    minute: number;
    opened: string[];
    remainingRankedClosed: string[];
    flowRate: number;
    steps: string[];
    flowRates?: number[];
    pressureSum: number;
    optimisticScore?: number;
}
