import { Puzzle } from './Puzzle';

interface Tree {
    height: number;
    iRow: number;
    iCol: number;
    sightlines: Tree[][];
}

export const puzzle8 = new Puzzle({
    day: 8,
    processFile: (fileData) => {
        const forest: Tree[][] = fileData
            .trim()
            .split(/\s/g)
            .map((row, iRow) =>
                row.split('').map((height, iCol) => ({
                    height: parseInt(height, 10),
                    iRow,
                    iCol,
                    sightlines: [],
                }))
            );
        forest.forEach((row, iRow) => {
            row.forEach((tree, iCol) => {
                tree.sightlines = [
                    Array.from(
                        { length: iRow },
                        (v, dY) => forest?.[iRow - (dY + 1)]?.[iCol]
                    ),
                    Array.from(
                        { length: forest.length - iRow - 1 },
                        (v, dY) => forest?.[iRow + (dY + 1)]?.[iCol]
                    ),
                    Array.from(
                        { length: iCol },
                        (v, dX) => forest?.[iRow]?.[iCol - (dX + 1)]
                    ),
                    Array.from(
                        { length: row.length - iCol - 1 },
                        (v, dX) => forest?.[iRow]?.[iCol + (dX + 1)]
                    ),
                ];
            });
        });
        return forest;
    },
    part1: (forest) => {
        const trees = forest.flat();
        return trees.filter((tree) =>
            tree.sightlines.some((treeRow) =>
                treeRow.every((t) => t.height < tree.height)
            )
        ).length;
    },
    part2: (forest) => {
        const trees = forest.flat();
        const scenicScores = trees.map((tree) =>
            tree.sightlines.reduce((score, treeRow) => {
                let nVisibleInRow = 0;
                for (let i = 0; i < treeRow.length; i++) {
                    const t = treeRow[i];
                    nVisibleInRow++;
                    if (t.height >= tree.height) {
                        break;
                    }
                }
                return score * nVisibleInRow;
            }, 1)
        );
        return Math.max(...scenicScores);
    },
});
