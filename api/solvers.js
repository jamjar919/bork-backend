const Tools = require('./tools');
const Graph = require('./graph');
const mathjs = require('mathjs');
const numeric = require('numericjs');
const permute = Tools.permute,
calculatePartition = Tools.calculatePartition,
splitArray = Tools.splitArray,
intArray = Tools.intArray,
getRandomInt = Tools.getRandomInt,
addArray = Tools.addArray;

const MIN_COARSEGROW_PARTITION_SIZE = 20;

// Import numeric.js into math.js
mathjs.import(numeric, {wrap: true, silent: true});

module.exports.partitionResizer = function(G, solution, goalSizes, debug = false) {
    if (!goalSizes) {
        console.error("Goal sizes not defined",goalSizes)
    }
    let log = (m) => {
        console.log(m);
    };
    if (!debug) {
        log = () => {};
    }
    if (solution.length !== goalSizes.length) {
        console.error("Solution length and sizes length are different sizes=",goalSizes," solution=",solution);
        return false;
    }
    // If we have different sizes of graph and sum of the partition sizes we obviously cannot make it work 
    if (goalSizes.reduce((a, b) => (a + b)) !== G.size) {
        console.error("Sum of the goal sizes is not equal to the size of the Graph")
        return false;
    }
    solution.sort((a, b) => (b.length - a.length));
    goalSizes.sort((a, b) => (b - a));
    // We are going to greedily swap nodes from the leftmost partition to the rightmost until it's full, choosing the one with lowest cost
    let leftPointer = 0;
    let rightPointer = solution.length - 1;
    // Loop while solution length !== goalsizes on each element of the arrays
    log("resizing partitions...");
    while (
        ! solution.reduce(
            (a, element, index) => (
                a && (element.length === goalSizes[index])
            ),
            true
        )
    ) {
        log("moving elements...");
        // Check pointers are from an array that's overfilled
        if (solution[leftPointer].length <= goalSizes[leftPointer]) {
            leftPointer += 1
        } else if (solution[rightPointer].length >= goalSizes[rightPointer]) {
            // ...and to one that's underfilled
            rightPointer -= 1;
        } else {
            // Start comparing possible moves
            const possibleMoves = solution[leftPointer];
            const destination = solution[rightPointer]
            let bestMove = undefined;
            let bestScore = undefined;
            for (let i = 0; i < possibleMoves.length; i += 1) {
                const nodeToMove = possibleMoves[i];
                // Calculate the original difference
                let odifference = 0;
                for (let j = 0; j < G.size; j += 1) {
                    if (!(possibleMoves.indexOf(j) > -1)) {
                        odifference += G.weight(j, nodeToMove);     
                    }
                }
                // Calculate the new difference
                let difference = 0;
                for (let j = 0; j < G.size; j += 1) {
                    if (!(destination.indexOf(j) > -1)) {
                        difference += G.weight(j, nodeToMove);     
                    }
                }
                // Calculate the difference of ... differences? 
                const score = difference - odifference;
                if (score < 0) {
                    // The node is actually better in the new partition, move it
                    bestMove = nodeToMove;
                    break;
                }
                if (
                    (typeof bestMove === 'undefined') || (score < bestScore)   
                ) {
                    bestMove = nodeToMove;
                    bestScore = score;
                }
            }
            // Actually move the node
            log("moving "+bestMove+" from partition "+leftPointer+" to "+rightPointer);            
            const index = solution[leftPointer].indexOf(bestMove);
            if (index > -1) { 
                solution[leftPointer].splice(index, 1);
            }
            solution[rightPointer].push(bestMove);
        }
    }
    return solution;
}

module.exports.simplify = function (G, n, sizes, solver, solverArguments = []) {
    // Simplify a graph by removing all nodes with no connections
    let removedNodes = [];
    const remainingNodes = [];
    for (let node = 0; node < G.size; node += 1) {
        const neighbours = G.neighbours(node).concat(G.edgesTo(node));
        if (
            neighbours.reduce((a, b) =>  a + b, 0) === 0
        ) {
            removedNodes.push(node);
        } else {
            remainingNodes.push(node);
        }
    }

    // Actual remove
    const G_dash = G.copy();
    removedNodes = removedNodes.sort((a, b) => b - a);
    for (let i = 0; i < removedNodes.length; i += 1) {
        G_dash.deleteNode(removedNodes[i]);
    }

    // Calculate proportionate sizes and n
    sizes = sizes.sort((a, b) => a - b)
    let sizes_dash = Object.assign([], sizes);
    let numToRemove = removedNodes.length;
    for (let i = 0; i < sizes_dash.length; i += 1) {
        while (
            (sizes_dash[i] > 0) &&
            (numToRemove > 0)
        ) {
            sizes_dash[i] -= 1;
            numToRemove -= 1;
        }
    }
    // Remove all zero'd and change n to reflect
    while(sizes_dash.indexOf(0) !== -1) {
        sizes_dash.splice(sizes_dash.indexOf(0), 1);
    }
    n_dash = sizes_dash.length; 

    // Get the solution for the smaller graph
    let solution = solver(G_dash, n_dash, sizes_dash, ...solverArguments)

    // Map solution back onto original nodes
    solution = solution.map(
        (val, index) => val.map((n, index) => remainingNodes[n])
    )

    // Add back all the missing nodes (it doesn't matter where we add them as the contribution to the cut is non existent)
    while (sizes_dash.length !== sizes.length) {
        sizes_dash.push(0)
        solution.push([])
    }
    sizes_dash = sizes_dash.sort((a, b) => b - a);
    sizes = sizes.sort((a, b) => b - a);

    // Add to the smallest partitions until goal sizes are equal
    currentPartitionToAddTo = 0;
    for (let i = 0; i < removedNodes.length; i += 1) {
        while (
            sizes[currentPartitionToAddTo] === sizes_dash[currentPartitionToAddTo]
        ) {
            currentPartitionToAddTo += 1;
        }
        solution[currentPartitionToAddTo].push(removedNodes[i]);
        sizes_dash[currentPartitionToAddTo] += 1;
    }
    return solution;
}

module.exports.brute = function(G) {
    const permutations = Tools.permute(intArray(0, G.size));
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

module.exports.fillGraph = function (G, n, sizes = [], debug = false) {
    let log = (m) => {
        console.log(m);
    };
    if (!debug) {
        log = () => {};
    }
    // Select n random nodes to fill from
    const seeds = [];
    while (seeds.length < n) {
        const node = getRandomInt(0, G.size + 1);
        if (!(seeds.indexOf(node) > -1)) {
            seeds.push(node);
        }
    }
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

module.exports.spectral = function(G, n, sizes, debug = false) {
    // https://snap.stanford.edu/class/cs224w-readings/Pothen89Partition.pdf
    // http://research.nvidia.com/sites/default/files/pubs/2016-03_Parallel-Spectral-Graph/nvr-2016-001.pdf
    // numeric js http://www.numericjs.com/
    // how to get eigenvectors https://github.com/josdejong/mathjs/blob/master/examples/import.js#L59-L73
    let adjacency = mathjs.matrix(mathjs.zeros([G.size, G.size]));

    // Setup the matrix
    for (let i = 0; i < G.size; i += 1) {
        for (let j = 0; j < G.size; j += 1) {
            adjacency._data[i][j] = (G.weight(i, j) ? 1 : 0)
        }
    }
    const degree = mathjs.matrix(mathjs.zeros([G.size, G.size]));

    // Fill degree matrix
    for (let i = 0; i < G.size; i += 1) {
        degree._data[i][i] = G.degree(i);
    }
    // Make laplacian matrix
    adjacency = mathjs.multiply(-1,adjacency);
    const laplacian = mathjs.add(adjacency, degree);

    // Get eigenvalues
    const e = mathjs.eig(laplacian);
    let eigenvalues = e.lambda.x;
    const eigenvectors = e.E.x

    // Extract fieldler vector (second smallest eigenvector)
    const fieldler = eigenvalues.sort()[1]
    const fieldlerVector = eigenvectors[eigenvalues.indexOf(fieldler)]

    // Partition by sign initially
    let solution = [[], []];
    for (let i = 0; i < G.size; i += 1) {
        if (fieldlerVector[i] > 0) {
            solution[0].push({
                node: i,
                vec: fieldlerVector[i],
            })
        } else {
            solution[1].push({
                node: i,
                vec: fieldlerVector[i],
            })
        }
    }

    // This does not often produce balanced partitions so check the closeness of each to the other partition by sorting by size
    solution = solution.map((val) => {
        return val.sort((a,b) => Math.abs(a.vec) - Math.abs(b.vec));
    })
    solution = solution.sort((a,b) => {
        return b.length - a.length
    })
    sizes = sizes.sort((a,b) => {
        a - b
    })
    let i = 0;
    while (
        solution[0].length !== sizes[0]
    ) {
        // take the smallest member of partition zero (the larger one) and move it
        const element = solution[0][0];
        solution[0].splice(0, 1)
        solution[1].push(element)
    }
    solution = solution.map((partition) => partition.map(v => v.node));
    return solution;
}

module.exports.coarseGrow = function (G, n, sizes = undefined, minSize = undefined, debug = false) {
    let log = (m) => {
        console.log(m);
    };
    if (!debug) {
        log = () => {};
    }
    if (typeof sizes !== 'undefined') {
        n = sizes.length;
    } else {
        sizes = Tools.getSizes(G.size, n);
        log("inferred sizes from n as "+sizes)
    }
    if (typeof minSize === 'undefined') {
        minSize = Math.min(Math.max(Math.floor(G.size/n) + 1, n), MIN_COARSEGROW_PARTITION_SIZE);
    }
    log("goal size: "+minSize);
    const mapping = [];
    const history = [];
    let currentGraph = G.copy();
    history.push(currentGraph.copy());
    let stepNum = 0;
    while (currentGraph.size > minSize) {
        const edges = Tools.heavyEdges(currentGraph);
        
        // Combine the nodes at the top edge, and create a new graph
        if (edges.length <= 0) {
            break;
        }
        const edge = edges[0];     
        log("compressing edge "+edge.from+"->"+edge.to+" of weight "+edge.weight)   
        // Create a new edge to represent those nodes
        let node = currentGraph.addNode();
        log("    created node "+node)
        // Copy nodes to mapping to record structure
        mapping.push({ nodeid: node, nodes: [edge.to, edge.from], step: stepNum });
        // Copy edges from the two nodes to the new one
        log("    copying edges from "+edge.to+","+edge.from+" to "+node)
        currentGraph.copyEdges(edge.to, node);
        currentGraph.copyEdges(edge.from, node);
        
        // Delete edges
        log("    deleting edges "+edge.to+","+edge.from)
        if (edge.to === edge.from) {
            currentGraph.deleteNode(edge.to)
        } else {
            if (edge.to > edge.from) {
                currentGraph.deleteNode(edge.to)
                currentGraph.deleteNode(edge.from)
            } else {
                currentGraph.deleteNode(edge.from)
                currentGraph.deleteNode(edge.to)
            }
        }
        
        stepNum += 1;
        history.push(currentGraph.copy());
    }

    log("Solving small problem...")
    // Solve the smaller graph problem using previus method
    let best = undefined;
    let bestSol = [];
    let worst = 0;
    let worstSol = [];
    for (let i = 0; i < 100; i += 1) {
        const sol = module.exports.fillGraph(currentGraph, n);
        const cut = Tools.calculatePartition(currentGraph, sol);
        if (cut > worst) {
            worst = cut;
            worstSol = sol;
        }
        if ((cut < best) || !best) {
            best = cut;
            bestSol = sol;
        }
    }
    let solution = bestSol;
    log("done")

    let currentSize = currentGraph.size;
    log("Small solution:")
    log(solution)
    // Expand the solution using our saved vertices
    mapping.reverse();
    for (let i = 0; i < mapping.length; i += 1) {
        log("Reversing mapping step "+i)
        const modification = mapping[i];
        // The last added node is always the last node in the matrix, node size - 1
        // Delete this node, and save the partition where it was
        partitionId = -1;
        for(let p = 0; p < solution.length; p += 1) {
            var index = solution[p].indexOf(currentSize - 1);
            if (index > -1) {
                log("removing "+(currentSize - 1)+" in partition "+p);
                partitionId = p;
                solution[p].splice(index, 1);          
            }
        }
        currentSize += 1;
        // Simulate readding the nodes where they were by adjusting the other values of the array
        const sortedNodes = modification.nodes.sort((a, b) => (a-b));
        for (let j = 0; j < sortedNodes.length; j += 1)  {
            const nodeid = sortedNodes[j];
            log('    simulating adding '+nodeid)
            // Add lowest node first
            solution = solution.map((partition) => partition.map((value) => {
                if (value >= nodeid) {
                    value += 1;
                }
                return value;
            }));
            // Actually readd the node
            log('    actually adding '+nodeid)
            solution[partitionId].push(nodeid);            
        }
        log(modification);
        log(solution);
        const tempSizes = Tools.getSizes(currentSize, n);
        log("    readjusting partitions to sizes"+tempSizes)        
        solution = module.exports.partitionResizer(history[modification.step], solution, tempSizes, debug)
        log(solution)
    }
    // Fix final partition forever
    solution = module.exports.partitionResizer(G, solution, sizes, debug)
    return solution;
}
