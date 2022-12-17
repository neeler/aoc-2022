import { cartesianProduct } from '~/util/cartesianProduct';
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

export const puzzle16 = new Puzzle({
    day: 16,
    skipPart1: true,
    skipPart2: false,
    processFile: (fileData) => {
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
        const sortedValves = valves
            .slice()
            .sort((a, b) => b.flowRate - a.flowRate)
            .filter((v) => v.flowRate)
            .map((v) => v.name);
        if (!startingValve) {
            throw new Error('No starting valve found');
        }
        return {
            valves,
            sortedValves,
            valvesByName,
            startingValve,
        };
    },
    part1: ({ sortedValves, valvesByName, startingValve }) => {
        const timeLimit = 30;
        const startingId = getSignature({
            valveName: startingValve.name,
            remainingRankedClosed: sortedValves,
        });
        const scoredIdsSeen: Record<string, number> = {
            [startingId]: 0,
        };
        let valveQueue: QueuedStep[] = [
            {
                id: startingId,
                valveName: startingValve.name,
                previousValve: startingValve.name,
                minute: 1,
                isOpenByValve: {},
                flowRate: 0,
                pressureSum: 0,
                remainingRankedClosed: sortedValves,
                optimisticScore: calculateOptimisticScore({
                    valveName: startingValve.name,
                    valvesByName,
                    minutesRemaining: timeLimit - 1,
                    flowRate: 0,
                    remainingRankedClosed: sortedValves,
                    pressureSum: 0,
                }),
            },
        ];
        const addToQueue = (
            step: Omit<QueuedStep, 'id' | 'optimisticScore'>
        ) => {
            const id = getSignature({
                valveName: step.valveName,
                remainingRankedClosed: step.remainingRankedClosed,
            });
            const optimisticScore = calculateOptimisticScore({
                ...step,
                minutesRemaining: timeLimit - step.minute,
                valvesByName,
            });
            const existingScore = scoredIdsSeen[id] ?? 0;
            if (
                existingScore <= step.pressureSum &&
                optimisticScore >= maxPressure
            ) {
                scoredIdsSeen[id] = step.pressureSum;
                valveQueue.push({
                    id,
                    optimisticScore,
                    ...step,
                });
            }
        };
        let maxPressure = 0;
        while (valveQueue.length) {
            const {
                valveName,
                previousValve,
                minute,
                isOpenByValve,
                flowRate,
                pressureSum,
                remainingRankedClosed,
            } = valveQueue.shift() as QueuedStep;
            if (valveQueue.length % 100 === 0) {
                valveQueue = valveQueue.filter(
                    (step) => step.optimisticScore >= maxPressure
                );
            }
            const valve = valvesByName[valveName] as Valve;
            const nextPressureSum = pressureSum + flowRate;
            if (nextPressureSum > maxPressure) {
                maxPressure = nextPressureSum;
            }
            const nextMinute = minute + 1;
            if (nextMinute <= 30) {
                // add possible actions to queue
                if (!remainingRankedClosed.length) {
                    addToQueue({
                        valveName,
                        previousValve: valveName,
                        minute: nextMinute,
                        isOpenByValve,
                        flowRate,
                        pressureSum: nextPressureSum,
                        remainingRankedClosed,
                    });
                } else {
                    if (valve.flowRate > 0 && !isOpenByValve[valveName]) {
                        // open valve
                        addToQueue({
                            valveName,
                            previousValve: valveName,
                            minute: nextMinute,
                            isOpenByValve: {
                                ...isOpenByValve,
                                [valveName]: true,
                            },
                            flowRate: flowRate + valve.flowRate,
                            pressureSum: nextPressureSum,
                            remainingRankedClosed: remainingRankedClosed.filter(
                                (v) => v !== valveName
                            ),
                        });
                    }
                    if (
                        isOpenByValve[valveName] ||
                        remainingRankedClosed[0] !== valveName
                    ) {
                        valve.neighbors.forEach((neighbor) => {
                            if (neighbor.name !== previousValve) {
                                // move to neighbor
                                addToQueue({
                                    valveName: neighbor.name,
                                    previousValve: valveName,
                                    minute: nextMinute,
                                    isOpenByValve,
                                    flowRate,
                                    pressureSum: nextPressureSum,
                                    remainingRankedClosed,
                                });
                            }
                        });
                    }
                }
            }
        }
        return maxPressure;
    },
    part2: ({ valves, sortedValves, valvesByName, startingValve }) => {
        const timeLimit = 26;
        const startingId = getDuoSignature({
            yourValve: startingValve.name,
            elephantValve: startingValve.name,
            remainingRankedClosed: sortedValves,
        });
        const scoredIdsSeen: Record<string, number> = {
            [startingId]: 0,
        };
        let valveQueue: QueuedDuoStep[] = [
            {
                id: startingId,
                yourValve: startingValve.name,
                elephantValve: startingValve.name,
                yourPreviousValve: startingValve.name,
                elephantPreviousValve: startingValve.name,
                minute: 1,
                isOpenByValve: {},
                flowRate: 0,
                pressureSum: 0,
                remainingRankedClosed: sortedValves,
                optimisticScore: calculateOptimisticDuoScore({
                    yourValveName: startingValve.name,
                    elephantValveName: startingValve.name,
                    valvesByName,
                    minutesRemaining: timeLimit - 1,
                    flowRate: 0,
                    remainingRankedClosed: sortedValves,
                    pressureSum: 0,
                }),
            },
        ];
        const addToQueue = (
            step: Omit<QueuedDuoStep, 'id' | 'optimisticScore'>
        ) => {
            const id = getDuoSignature({
                yourValve: step.yourValve,
                elephantValve: step.elephantValve,
                remainingRankedClosed: step.remainingRankedClosed,
            });
            const optimisticScore = calculateOptimisticDuoScore({
                ...step,
                minutesRemaining: timeLimit - step.minute,
                yourValveName: step.yourValve,
                elephantValveName: step.elephantValve,
                valvesByName,
            });
            const existingScore = scoredIdsSeen[id] ?? 0;
            if (
                (!existingScore || existingScore < step.pressureSum) &&
                optimisticScore >= maxPressure
            ) {
                scoredIdsSeen[id] = step.pressureSum;
                valveQueue.push({
                    id,
                    optimisticScore,
                    ...step,
                });
            }
        };
        let maxPressure = 0;
        let lastMinuteLogged = 1;
        while (valveQueue.length) {
            const {
                yourValve: yourValveName,
                elephantValve: elephantValveName,
                yourPreviousValve,
                elephantPreviousValve,
                minute,
                isOpenByValve,
                flowRate,
                pressureSum,
                remainingRankedClosed,
            } = valveQueue.shift() as QueuedDuoStep;
            if (minute > lastMinuteLogged) {
                lastMinuteLogged = minute;
                console.log(
                    `${valveQueue.length} in queue at minute ${minute}`
                );
                console.log({ maxPressure });
                valveQueue = valveQueue.filter(
                    (step) => step.optimisticScore >= maxPressure
                );
                console.log(`${valveQueue.length} remain after filtering`);
            }
            const yourValve = valvesByName[yourValveName] as Valve;
            const elephantValve = valvesByName[elephantValveName] as Valve;
            const nextPressureSum = pressureSum + flowRate;
            if (nextPressureSum > maxPressure) {
                maxPressure = nextPressureSum;
            }
            const nextMinute = minute + 1;
            if (nextMinute <= 26) {
                // add possible actions to queue
                if (!remainingRankedClosed.length) {
                    addToQueue({
                        yourValve: yourValveName,
                        elephantValve: elephantValveName,
                        yourPreviousValve: yourValveName,
                        elephantPreviousValve: elephantValveName,
                        minute: nextMinute,
                        isOpenByValve,
                        flowRate,
                        pressureSum: nextPressureSum,
                        remainingRankedClosed,
                    });
                } else {
                    const yourPossibilities = [];
                    const elephantPossibilities = [];

                    if (
                        yourValve.flowRate > 0 &&
                        !isOpenByValve[yourValveName]
                    ) {
                        yourPossibilities.push('open');
                    }
                    if (
                        elephantValve.flowRate > 0 &&
                        !isOpenByValve[elephantValveName] &&
                        elephantValve !== yourValve
                    ) {
                        elephantPossibilities.push('open');
                    }
                    if (
                        isOpenByValve[yourValveName] ||
                        remainingRankedClosed[0] !== yourValveName
                    ) {
                        yourValve.neighbors.forEach((neighbor) => {
                            if (neighbor.name !== yourPreviousValve) {
                                yourPossibilities.push(neighbor.name);
                            }
                        });
                    }

                    if (
                        isOpenByValve[elephantValveName] ||
                        remainingRankedClosed[0] !== elephantValveName
                    ) {
                        elephantValve.neighbors.forEach((neighbor) => {
                            if (neighbor.name !== elephantPreviousValve) {
                                elephantPossibilities.push(neighbor.name);
                            }
                        });
                    }

                    const comboMoves = cartesianProduct(
                        yourPossibilities,
                        elephantPossibilities
                    );
                    const movesSeen: Record<string, boolean> = {};
                    comboMoves.forEach(([yourMove, elephantMove]) => {
                        const comboKey = [yourMove, elephantMove]
                            .sort()
                            .join('-');
                        if (movesSeen[comboKey]) {
                            return;
                        }
                        movesSeen[comboKey] = true;
                        const step: Omit<
                            QueuedDuoStep,
                            'id' | 'optimisticScore'
                        > = {
                            yourValve: yourValveName,
                            elephantValve: elephantValveName,
                            yourPreviousValve: yourValveName,
                            elephantPreviousValve: elephantValveName,
                            minute: nextMinute,
                            isOpenByValve,
                            flowRate,
                            pressureSum: nextPressureSum,
                            remainingRankedClosed,
                        };
                        if (yourMove === 'open') {
                            step.isOpenByValve = {
                                ...step.isOpenByValve,
                                [yourValveName]: true,
                            };
                            step.flowRate += yourValve.flowRate;
                            step.remainingRankedClosed =
                                remainingRankedClosed.filter(
                                    (v) => v !== yourValveName
                                );
                        } else {
                            step.yourValve = yourMove;
                        }
                        if (elephantMove === 'open') {
                            step.isOpenByValve = {
                                ...step.isOpenByValve,
                                [elephantValveName]: true,
                            };
                            step.flowRate += elephantValve.flowRate;
                            step.remainingRankedClosed =
                                remainingRankedClosed.filter(
                                    (v) => v !== elephantValveName
                                );
                        } else {
                            step.elephantValve = elephantMove;
                        }

                        addToQueue(step);
                    });
                }
            }
        }
        return maxPressure;
    },
});

function getSignature({
    valveName,
    remainingRankedClosed,
}: {
    valveName: string;
    remainingRankedClosed: string[];
}) {
    return `${valveName}:${remainingRankedClosed.join(',')}`;
}

function getDuoSignature({
    yourValve,
    elephantValve,
    remainingRankedClosed,
}: {
    yourValve: string;
    elephantValve: string;
    remainingRankedClosed: string[];
}) {
    return `${[yourValve, elephantValve]
        .sort()
        .join(',')}::${remainingRankedClosed.join(',')}`;
}

function sortValvesByValue({
    valveName,
    valvesByName,
    minutesRemaining,
    remainingRankedClosed,
}: {
    valveName: string;
    valvesByName: Record<string, Valve>;
    minutesRemaining: number;
    remainingRankedClosed: string[];
}) {
    return remainingRankedClosed
        .map((name) => ({
            value:
                valvesByName[name].flowRate *
                Math.max(
                    0,
                    minutesRemaining -
                        valvesByName[valveName].distancesByName[name] -
                        1
                ),
            name,
        }))
        .sort((a, b) => b.value - a.value);
}

function calculateOptimisticScore({
    valveName,
    valvesByName,
    minutesRemaining: startingMinutesRemaining,
    flowRate,
    remainingRankedClosed,
    pressureSum,
}: {
    valveName: string;
    valvesByName: Record<string, Valve>;
    minutesRemaining: number;
    flowRate: number;
    remainingRankedClosed: string[];
    pressureSum: number;
}) {
    let previousValve = valvesByName[valveName] as Valve;
    let currentValveName: string | undefined = valveName;
    let sortedByValue = remainingRankedClosed;
    let score = pressureSum;
    let minutesRemaining = startingMinutesRemaining;
    while (sortedByValue.length && minutesRemaining > 0) {
        sortedByValue = sortValvesByValue({
            valveName,
            valvesByName,
            minutesRemaining,
            remainingRankedClosed: sortedByValue,
        }).map((v) => v.name);
        currentValveName = sortedByValue.shift();
        const distance = currentValveName
            ? previousValve.getDistance(currentValveName)
            : 0;
        if (currentValveName && distance + 1 < minutesRemaining) {
            previousValve = valvesByName[currentValveName] as Valve;
            score +=
                previousValve.flowRate *
                Math.min(minutesRemaining, distance + 1);
            minutesRemaining = minutesRemaining - (distance + 1);
        }
    }
    if (minutesRemaining) {
        score += flowRate * minutesRemaining;
    }
    return score;
}

function calculateOptimisticDuoScore({
    yourValveName,
    elephantValveName,
    valvesByName,
    minutesRemaining: startingMinutesRemaining,
    flowRate,
    remainingRankedClosed,
    pressureSum,
}: {
    yourValveName: string;
    elephantValveName: string;
    valvesByName: Record<string, Valve>;
    minutesRemaining: number;
    flowRate: number;
    remainingRankedClosed: string[];
    pressureSum: number;
}) {
    let yourPreviousValve = valvesByName[yourValveName] as Valve;
    let elephantPreviousValve = valvesByName[elephantValveName] as Valve;
    let yourCurrentValveName: string | undefined = yourValveName;
    let elephantCurrentValveName: string | undefined = elephantValveName;
    let yourSortedByValue = remainingRankedClosed;
    let elephantSortedByValue = remainingRankedClosed;
    let score = pressureSum;
    let minutesRemaining = startingMinutesRemaining;

    const valvesSeen: Record<string, boolean> = {};

    while (
        (yourSortedByValue.length || elephantSortedByValue.length) &&
        minutesRemaining > 0
    ) {
        const yourSorted = yourCurrentValveName
            ? sortValvesByValue({
                  valveName: yourCurrentValveName,
                  valvesByName,
                  minutesRemaining,
                  remainingRankedClosed: yourSortedByValue,
              })
            : [];
        yourSortedByValue = yourSorted.map((v) => v.name);
        const elephantSorted = elephantCurrentValveName
            ? sortValvesByValue({
                  valveName: elephantCurrentValveName,
                  valvesByName,
                  minutesRemaining,
                  remainingRankedClosed: elephantSortedByValue,
              })
            : [];
        elephantSortedByValue = elephantSorted.map((v) => v.name);

        yourCurrentValveName = yourSortedByValue.shift();
        elephantCurrentValveName = elephantSortedByValue.shift();

        if (
            yourCurrentValveName &&
            yourCurrentValveName === elephantCurrentValveName
        ) {
            if (yourSorted[0].value >= elephantSorted[0].value) {
                elephantCurrentValveName = elephantSortedByValue.shift();
            } else {
                yourCurrentValveName = yourSortedByValue.shift();
            }
        }

        const yourDistance = yourCurrentValveName
            ? yourPreviousValve.getDistance(yourCurrentValveName)
            : 0;
        const elephantDistance = elephantCurrentValveName
            ? elephantPreviousValve.getDistance(elephantCurrentValveName)
            : 0;
        const minDistance =
            yourDistance && elephantDistance
                ? Math.min(yourDistance, elephantDistance)
                : yourDistance || elephantDistance;
        if (
            (yourCurrentValveName || elephantCurrentValveName) &&
            minDistance + 1 < minutesRemaining
        ) {
            if (yourCurrentValveName && elephantCurrentValveName) {
                // Simplify by using the minimum distance
                yourPreviousValve = valvesByName[yourCurrentValveName] as Valve;
                elephantPreviousValve = valvesByName[
                    elephantCurrentValveName
                ] as Valve;
                score +=
                    (yourPreviousValve.flowRate +
                        elephantPreviousValve.flowRate) *
                    Math.min(minutesRemaining, minDistance + 1);
                minutesRemaining = minutesRemaining - (minDistance + 1);
            } else if (yourCurrentValveName) {
                yourPreviousValve = valvesByName[yourCurrentValveName] as Valve;
                score +=
                    yourPreviousValve.flowRate *
                    Math.min(minutesRemaining, yourDistance + 1);
                minutesRemaining = minutesRemaining - (yourDistance + 1);
            } else if (elephantCurrentValveName) {
                elephantPreviousValve = valvesByName[
                    elephantCurrentValveName
                ] as Valve;
                score +=
                    elephantPreviousValve.flowRate *
                    Math.min(minutesRemaining, elephantDistance + 1);
                minutesRemaining = minutesRemaining - (elephantDistance + 1);
            }
        }
    }
    if (minutesRemaining) {
        score += flowRate * minutesRemaining;
    }
    return score;
}

interface QueuedStep {
    id: string;
    valveName: string;
    previousValve: string;
    minute: number;
    isOpenByValve: Record<string, boolean>;
    remainingRankedClosed: string[];
    flowRate: number;
    pressureSum: number;
    optimisticScore: number;
}

interface QueuedDuoStep {
    id: string;
    yourValve: string;
    elephantValve: string;
    yourPreviousValve: string;
    elephantPreviousValve: string;
    minute: number;
    isOpenByValve: Record<string, boolean>;
    remainingRankedClosed: string[];
    flowRate: number;
    pressureSum: number;
    optimisticScore: number;
}
