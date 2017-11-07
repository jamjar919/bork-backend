import { permute, calculatePartition, splitArray, intArray, getRandomInt, addArray } from './tools';

export function brute(G) {
    const permutations = permute(intArray(0, G.size));
    let bestPartition = [];
    let best = null;
    for (let i = 0; i < permutations.length; i += 1) {
        const p = permutations[i];
        const partition = splitArray(p, p.length / 2);
        const score = calculatePartition(G, partition);
        if (
            (best === null) ||
            (score < best)
        ) {
            bestPartition = partition;
            best = score;
        }
    }
    return bestPartition;
}

export function fillGraph(G, n, debug = false) {
    let log = (m) => {
        console.log(m);
    };
    if (!debug) {
        log = () => {};
    }
    // Select n random nodes to fill from
    const seeds = [];
    while (seeds.length < n) {
        const node = getRandomInt(0, G.size);
        if (!(seeds.indexOf(node) > -1)) {
            seeds.push(node);
        }
    }
    log('seeds', seeds);
    const partitions = [];
    // Init partitions array
    for (let i = 0; i < seeds.length; i += 1) {
        partitions.push([
            seeds[i],
        ]);
    }
    const remainingNodes = intArray(0, G.size);
    // Remove seeds from remaining nodes
    for (let i = 0; i < seeds.length; i += 1) {
        remainingNodes.splice(remainingNodes.indexOf(seeds[i]), 1);
    }
    while (remainingNodes.length > 0) {
        log('remaining nodes', remainingNodes);
        for (let i = 0; i < partitions.length; i += 1) {
            if (remainingNodes.length > 0) {
                const partition = partitions[i];
                // Get neighbours of the current partition
                let neighbours = [];
                for (let j = 0; j < partition.length; j += 1) {
                    if (neighbours.length === 0) {
                        neighbours = G.neighbours(partition[j]);
                    }
                    // Add the reverse in, as the graph goes both ways
                    const immediateNeighbours = G.neighbours(partition[j]);
                    for (let z = 0; z < immediateNeighbours.length; z += 1) {
                        immediateNeighbours[j] += G.weight(z, j);
                    }
                    neighbours = addArray(neighbours, immediateNeighbours);
                }

                log('  neighbours of partition', partition, 'are', neighbours);

                // Find best neighbour to add
                let bestWeight = 0;
                let bestIndex = 0;
                for (let neighbour = 0; neighbour < neighbours.length; neighbour += 1) {
                    const weight = neighbours[neighbour];
                    // Check if there is a connection
                    if (weight !== 0) {
                        // Check if node was already picked
                        if (remainingNodes.indexOf(neighbour) > -1) {
                            // Check if it beats best
                            if (weight > bestWeight) {
                                bestWeight = weight;
                                bestIndex = neighbour;
                            }
                        }
                    }
                }
                if (bestWeight === 0) {
                    // Randomly assign an unused index as the graph must be disconnected
                    log('  randomly picking number from remaining values', remainingNodes);
                    bestIndex = remainingNodes[getRandomInt(0, remainingNodes.length)];
                }
                // We found a valid neighbour add it to the partition
                partition.push(bestIndex);
                partitions[i] = partition;
                remainingNodes.splice(remainingNodes.indexOf(bestIndex), 1);
                log('  adding index', bestIndex, 'to form partition ', partition);
            }
        }
    }
    return partitions;
}
