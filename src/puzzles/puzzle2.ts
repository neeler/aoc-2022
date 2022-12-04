import { Puzzle } from './Puzzle';

type Shape = 'rock' | 'paper' | 'scissors';
const shapeScores: Record<Shape, number> = {
    rock: 1,
    paper: 2,
    scissors: 3,
};
type Outcome = 'loss' | 'draw' | 'win';
const outcomeScores: Record<Outcome, number> = {
    loss: 0,
    draw: 3,
    win: 6,
};

type FirstColumnDatum = 'A' | 'B' | 'C';
type SecondColumnDatum = 'X' | 'Y' | 'Z';

const opponentMoves: Record<FirstColumnDatum, Shape> = {
    A: 'rock',
    B: 'paper',
    C: 'scissors',
};

export const puzzle2 = new Puzzle({
    day: 2,
    processFile: (fileData) => {
        return fileData
            .split('\n')
            .map(
                (row) => row.split(' ') as [FirstColumnDatum, SecondColumnDatum]
            );
    },
    part1: (rounds) => {
        const yourMoves: Record<SecondColumnDatum, Shape> = {
            X: 'rock',
            Y: 'paper',
            Z: 'scissors',
        };
        return rounds.reduce((sum, [firstColumn, secondColumn]) => {
            const opponentMove = opponentMoves[firstColumn];
            const yourMove = yourMoves[secondColumn];
            const roundScore =
                shapeScores[yourMove] +
                (() => {
                    const opponentShapeScore = shapeScores[opponentMove] - 1;
                    const yourShapeScore = shapeScores[yourMove] - 1;
                    if (opponentShapeScore === yourShapeScore) {
                        return outcomeScores.draw;
                    }
                    if ((opponentShapeScore + 1) % 3 === yourShapeScore) {
                        return outcomeScores.win;
                    }
                    return outcomeScores.loss;
                })();
            return sum + roundScore;
        }, 0);
    },
    part2: (rounds) => {
        const outcomes: Record<SecondColumnDatum, Outcome> = {
            X: 'loss',
            Y: 'draw',
            Z: 'win',
        };
        const shapesByScore = Object.fromEntries(
            Object.entries(shapeScores).map(([shape, score]) => [score, shape])
        ) as Record<string, Shape>;
        return rounds.reduce((sum, [firstColumn, secondColumn]) => {
            const opponentMove = opponentMoves[firstColumn];
            const targetOutcome = outcomes[secondColumn];
            const outcomeScore = outcomeScores[targetOutcome];

            const outcomeAdder = (outcomeScore - 3) / 3;
            const opponentShapeScore = shapeScores[opponentMove];
            const yourMove = (() => {
                return shapesByScore[
                    ((3 + (outcomeAdder + (opponentShapeScore - 1))) % 3) + 1
                ];
            })();
            const roundScore =
                shapeScores[yourMove] + outcomeScores[targetOutcome];
            return sum + roundScore;
        }, 0);
    },
});
