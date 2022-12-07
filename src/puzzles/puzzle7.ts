import { Puzzle } from './Puzzle';

interface Action {
    command: string;
    argument: string;
    responses: string[];
}

interface Directory {
    name: string;
    size: number;
    files: File[];
    directories: Directory[];
    parentDirectory?: Directory;
}

interface File {
    name: string;
    size: number;
}

function calculateSizeOfDirectory(directory: Directory): number {
    return (
        directory.files.reduce((sum, file) => sum + file.size, 0) +
        directory.directories.reduce(
            (sum, childDir) => sum + calculateSizeOfDirectory(childDir),
            0
        )
    );
}

function flattenDirectories(directory: Directory): Directory[] {
    const directories = [directory];
    directory.directories.forEach((child) => {
        directories.push(...flattenDirectories(child));
    });
    return directories;
}

export const puzzle7 = new Puzzle({
    day: 7,
    processFile: (fileData) => {
        const lines = fileData.trim().split('\n');
        const actions = lines.reduce((actionsSoFar, line) => {
            if (line.startsWith('$')) {
                actionsSoFar.push({
                    command: line.slice(2, 4),
                    argument: line.slice(5),
                    responses: [],
                });
            } else {
                const lastAction = actionsSoFar[actionsSoFar.length - 1];
                if (lastAction) {
                    lastAction.responses.push(line);
                }
            }
            return actionsSoFar;
        }, Array<Action>());
        const root: Directory = {
            name: '/',
            size: 0,
            files: [],
            directories: [],
        };
        let activeDirectory: Directory | undefined;
        actions.forEach(({ command, argument, responses }) => {
            switch (command) {
                case 'cd': {
                    if (argument === '/') {
                        activeDirectory = root;
                    } else if (argument === '..') {
                        if (activeDirectory?.parentDirectory) {
                            activeDirectory = activeDirectory.parentDirectory;
                        }
                    } else {
                        const matchingDirectory =
                            activeDirectory?.directories.find(
                                (directory) => directory.name === argument
                            );
                        if (matchingDirectory) {
                            activeDirectory = matchingDirectory;
                        }
                    }
                    break;
                }
                case 'ls': {
                    const files = Array<File>();
                    const directories = Array<Directory>();
                    responses.forEach((response) => {
                        const [detail, name] = response.split(' ');
                        if (detail === 'dir') {
                            directories.push({
                                name,
                                size: 0,
                                files: [],
                                directories: [],
                                parentDirectory: activeDirectory,
                            });
                        } else {
                            files.push({
                                name,
                                size: parseInt(detail, 10),
                            });
                        }
                    });
                    if (activeDirectory) {
                        activeDirectory.files = files;
                        activeDirectory.directories = directories;
                        activeDirectory.size =
                            calculateSizeOfDirectory(activeDirectory);
                        let parent = activeDirectory.parentDirectory;
                        while (parent) {
                            parent.size = calculateSizeOfDirectory(parent);
                            parent = parent.parentDirectory;
                        }
                    }
                    break;
                }
            }
        });
        const allDirectories = flattenDirectories(root);
        return {
            root,
            allDirectories,
        };
    },
    part1: ({ allDirectories }) => {
        const smallDirectories = allDirectories.filter(
            (dir) => dir.size <= 100000
        );
        return smallDirectories.reduce((sum, dir) => sum + dir.size, 0);
    },
    part2: ({ root, allDirectories }) => {
        const totalSpace = 70000000;
        const totalSpaceNeeded = 30000000;
        const currentFreeSpace = totalSpace - root.size;
        const additionalSpaceNeeded = totalSpaceNeeded - currentFreeSpace;
        const sortedDirectories = allDirectories
            .slice()
            .sort((a, b) => a.size - b.size);
        let target: Directory | undefined;
        for (let i = 0; i < sortedDirectories.length; i++) {
            const directory = sortedDirectories[i];
            if (directory.size >= additionalSpaceNeeded) {
                target = directory;
                break;
            }
        }
        return target?.size;
    },
});
