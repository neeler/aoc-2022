import { Puzzle } from './Puzzle';

function charMap(letters: string[]) {
    return letters.reduce((byLetter, letter) => {
        byLetter[letter] = true;
        return byLetter;
    }, {} as Record<string, true>);
}

function detectMarker(letters: string[], uniqueRequired: number) {
    const lastSeen = Array<string>();
    let endOfBufferIndex: number | undefined;
    letters.forEach((letter, index) => {
        if (endOfBufferIndex) return;

        if (lastSeen.length > uniqueRequired) {
            lastSeen.shift();
        }

        if (lastSeen.length === uniqueRequired) {
            if (Object.entries(charMap(lastSeen)).length === uniqueRequired) {
                endOfBufferIndex = index;
            }
        }

        lastSeen.push(letter);
    });
    return endOfBufferIndex;
}

export const puzzle6 = new Puzzle({
    day: 6,
    processFile: (fileData) => fileData.trim().split(''),
    part1: (data) => detectMarker(data, 4),
    part2: (data) => detectMarker(data, 14),
});
