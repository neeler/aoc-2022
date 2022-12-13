import { Puzzle } from './Puzzle';

type PacketData = number | Packet;
type PacketPair = [Packet, Packet];

class Packet {
    parent?: Packet;
    children: PacketData[];

    constructor({
        parent,
        children = [],
    }: { parent?: Packet; children?: PacketData[] } = {}) {
        this.parent = parent;
        this.children = children;
    }

    static compare(left: PacketData, right: PacketData): boolean | undefined {
        let isCorrect: boolean | undefined;
        if (typeof left === 'number' && typeof right === 'number') {
            if (left > right) {
                isCorrect = false;
            } else if (left < right) {
                isCorrect = true;
            }
        } else if (typeof left === 'object' && typeof right === 'object') {
            const leftQueue = left.children.slice();
            const rightQueue = right.children.slice();
            while (leftQueue.length) {
                const leftChild = leftQueue.shift() as PacketData;
                const rightChild = rightQueue.shift();
                if (rightChild) {
                    isCorrect = Packet.compare(leftChild, rightChild);
                    if (isCorrect !== undefined) {
                        break;
                    }
                } else {
                    isCorrect = false;
                    break;
                }
            }
            if (isCorrect === undefined && rightQueue.length) {
                isCorrect = true;
            }
        } else if (typeof left === 'number') {
            isCorrect = Packet.compare(new Packet({ children: [left] }), right);
        } else if (typeof right === 'number') {
            isCorrect = Packet.compare(left, new Packet({ children: [right] }));
        }
        return isCorrect;
    }

    toString(): string {
        return `[${this.children.map((child) => child.toString()).join(',')}]`;
    }
}

function parsePacket(packetString: string) {
    let topPacket: Packet | undefined;
    let currentPacket: Packet | undefined = topPacket;
    let stringInProgress = '';
    const chars = packetString.split('');
    const processString = () => {
        if (stringInProgress) {
            const value = parseInt(stringInProgress, 10);
            if (Number.isNaN(value)) {
                throw new Error(`Parsing error: ${value}`);
            }
            currentPacket?.children.push(value);
            stringInProgress = '';
        }
    };
    chars.forEach((char) => {
        switch (char) {
            case '[': {
                if (currentPacket) {
                    const newPacket = new Packet({
                        parent: currentPacket,
                    });
                    currentPacket.children.push(newPacket);
                    currentPacket = newPacket;
                } else {
                    currentPacket = new Packet();
                    topPacket = topPacket ?? currentPacket;
                }
                break;
            }
            case ']': {
                processString();
                currentPacket = currentPacket?.parent;
                break;
            }
            case ',': {
                processString();
                break;
            }
            default: {
                stringInProgress += char;
                break;
            }
        }
    });
    if (!topPacket) {
        throw new Error('No packet created');
    }
    return topPacket;
}

export const puzzle13 = new Puzzle({
    day: 13,
    processFile: (fileData) => {
        const packets: Packet[] = [];
        const lines = fileData.trim().split('\n');
        const nPairs = Math.floor((lines.length + 1) / 3);
        for (let i = 0; i < nPairs; i++) {
            const [left, right] = lines.slice(i * 3);
            if (left && right) {
                packets.push(parsePacket(left), parsePacket(right));
            }
        }
        return packets;
    },
    part1: (packets) => {
        const pairs: PacketPair[] = [];
        const nPairs = Math.floor(packets.length / 2);
        for (let i = 0; i < nPairs; i++) {
            const [left, right] = packets.slice(i * 2);
            if (left && right) {
                pairs.push([left, right]);
            }
        }
        const comparisons = pairs.map(([left, right]) =>
            Packet.compare(left, right)
        );
        return comparisons.reduce(
            (sum, isCorrect, index) => (isCorrect ? sum + index + 1 : sum),
            0
        );
    },
    part2: (inputPackets) => {
        const divider2 = parsePacket('[[2]]');
        const divider6 = parsePacket('[[6]]');
        const packets = inputPackets.concat([divider2, divider6]);

        const sortedPackets: Packet[] = [];
        const possibleRightsPerPacket: Record<string, number[]> = {};
        packets.forEach((packet, iPacket) => {
            possibleRightsPerPacket[iPacket] = packets.reduce((soFar, p, i) => {
                if (i !== iPacket && Packet.compare(packet, p)) {
                    soFar.push(i);
                }
                return soFar;
            }, Array<number>());
        });
        let remainingPackets = Object.entries(possibleRightsPerPacket);
        while (
            sortedPackets.length < packets.length &&
            remainingPackets.length
        ) {
            let iRightmostPacket = Number(
                remainingPackets.find(
                    ([iPacket, iRights]) => iRights.length === 0
                )?.[0]
            );
            if (!Number.isNaN(iRightmostPacket)) {
                sortedPackets.unshift(packets[iRightmostPacket]);
                remainingPackets = remainingPackets.reduce(
                    (remaining, [iPacket, iRights]) => {
                        if (iPacket !== iRightmostPacket.toString()) {
                            remaining.push([
                                iPacket,
                                iRights.filter(
                                    (iRight) => iRight !== iRightmostPacket
                                ),
                            ]);
                        }
                        return remaining;
                    },
                    Array<[string, number[]]>()
                );
            } else {
                throw new Error('No rightmost packet found!');
            }
        }
        return (
            (sortedPackets.findIndex((p) => p === divider2) + 1) *
            (sortedPackets.findIndex((p) => p === divider6) + 1)
        );
    },
});
