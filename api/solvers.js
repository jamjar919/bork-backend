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

module.exports.random = function(G, n, sizes) {
    // Generate a random partition
    const nodesLeft = [];
    for (let i = 0; i < G.size; i += 1) {
        nodesLeft.push(i);
    }
    const solution = [];
    for (let p = 0; p < n; p += 1) {
        solution.push([])
        for (let i = 0; i < sizes[p]; i += 1) {
            const index = getRandomInt(0, nodesLeft.length + 1);
            const node = nodesLeft.splice(index, 1)[0];
            solution[p].push(node);
        }
    }
    return solution
}

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
    console.log("Simplifying input graph...")
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

    console.log(`Simplified original graph of size ${G.size} to ${G_dash.size}`)

    // Identify connected components of the graph
    const components = Tools.connectedComponents(G_dash);
    console.log(`${components.length} connected components of sizes ${components.map(val => val.length)}`)

    // Get the solution for the smaller graph
    let solution = solver(G_dash, n_dash, sizes_dash, ...solverArguments)

    console.log(`Solved`);

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

    // Sanity check
    if (!(sizes.length > 1)) {
        // There's only one partition just return all the nodes
        const solution = [[]];
        for (let i = 0; i < G.size; i += 1) {
            solution[0].push(i)
        }
        return solution;
    }

    console.log(sizes)
    let sizesNext = []
    if (sizes.length > 2) {
        sizesNext = Object.assign([], sizes)
        // Make the smallest partitions first
        console.log("sizesnext",sizesNext)
        sizesNext.splice(0, 1)
        const goalSizes = [sizes[0], 0]
        goalSizes[1] = sizes.reduce((a, v) => a + v, 0) - sizes[0];
        sizes = goalSizes
        console.log(sizes)
    }
    
    let adjacency = mathjs.matrix(mathjs.zeros([G.size, G.size]));
    const max = G.maxEdgeWeight();
    // Setup the matrix
    for (let i = 0; i < G.size; i += 1) {
        for (let j = 0; j < G.size; j += 1) {
            adjacency._data[i][j] = G.weight(i, j) >= 0 ? Math.sqrt(G.weight(i, j)) : -(Math.sqrt(Math.abs(G.weight(i, j))))
        }
    }
    const degree = mathjs.matrix(mathjs.zeros([G.size, G.size]));

    // Fill degree matrix
    for (let i = 0; i < G.size; i += 1) {
        degree._data[i][i] = adjacency._data[i].reduce((a, b) => a + b, 0);
    }
    // Make laplacian matrix
    adjacency = mathjs.multiply(-1,adjacency);
    const laplacian = mathjs.add(adjacency, degree);

    // Get eigenvalues
    const e = mathjs.eig(laplacian);
    let eigenvalues = e.lambda.x;
    const eigenvectors = e.E.x

    // Extract fieldler vector (second smallest eigenvector)
    const eigenvaluesCopy = Object.assign([], eigenvalues)
    eigenvalues.sort()
    const fieldler = eigenvalues[1]
    const fieldlerVector = eigenvectors[eigenvaluesCopy.indexOf(fieldler)]

    // Partition by sign initially
    const median = mathjs.median(fieldlerVector);

    let solution = [[], []];
    for (let i = 0; i < G.size; i += 1) {
        if (fieldlerVector[i] > median) {
            solution[0].push({
                    node: i,
                    val: fieldlerVector[i]
                })
        } else {
            solution[1].push({
                node: i,
                val: fieldlerVector[i]
            })
        }
    }

    // While solution is not of the correct sizes
    solution[0].sort((a,b) => b.val - a.val)
    solution[1].sort((a,b) => b.val - a.val)
    // identify the more strongly connected part of the graph
    const cohesiveness0 = Tools.internalEdges(G, solution[0].map((val) => val.node));
    const cohesiveness1 = Tools.internalEdges(G, solution[1].map((val) => val.node));
    let takeFrom = 0;
    if (cohesiveness0 > cohesiveness1) {
        takeFrom = 1;
    }

    // We have always that every node in solution[0] has higher val than every node in solution[1]
    while (!(
        (
            (solution[0].length === sizes[0]) &&
            (solution[1].length === sizes[1])
        ) || (
            (solution[0].length === sizes[1]) &&
            (solution[1].length === sizes[0])
        )
     )) {
        if (takeFrom === 0) {
            // Move smallest node to the next partition
            const node = solution[0].splice(-1, 1)[0]
            solution[1].push(node)
        } else {
            // Move largest node to the next partition
            const node = solution[1].splice(1, 1)[0]
            solution[0].push(node)
        }
    }

    solution = solution.map(val => val.map((val) => val.node))

    // Improve using KernighanLin greedy algorithm
    let lastQuality = Tools.calculatePartition(G, solution);
    solution = KernighanLin(G, solution);
    let quality = Tools.calculatePartition(G, solution);
    while (quality < lastQuality) {
        lastQuality = quality;
        solution = KernighanLin(G, solution);
        quality = Tools.calculatePartition(G, solution);
    }

    // Smallest partition is removed
    solution.sort((a, b) => a.length-b.length)

    if (sizesNext.length !== 0) {
        // recurse into next sol
        // Remove nodes in smallest partition
        const removedNodes = solution[0]
        console.log(`removed partition is of size ${solution[0].length}`)
        removedNodes.sort((a, b) => b-a)
        const remainingNodes = Tools.intArray(0, G.size)
        const G_dash = G.copy();
        for (let i = 0; i < removedNodes.length; i += 1) {
            G_dash.deleteNode(removedNodes[i])
            remainingNodes.splice(remainingNodes.indexOf(removedNodes[i]), 1)
        }
        solution = [solution[0]]
        console.log("recursing into graph of size",G_dash.size," goal sizes ",sizesNext)
        let solution_dash = module.exports.spectral(G_dash, sizesNext.length, sizesNext) 
        // Remap to original nodes
        solution_dash = solution_dash.map((val) => val.map(val => remainingNodes[val]))
        solution = solution.concat(solution_dash)      
    }
    return solution;
}

function KernighanLin(G, solution) {
    // Partition improver for bisections
    // O(n^2 log n)
    // Check solution is balanced
    if (!Tools.isValidPartition(G, solution)) {
        throw "Not a valid partition of G";
        return false;
    }
    // Deepcopy to destroy reference
    const A = Object.assign([], solution[0])
    const B = Object.assign([], solution[1])
    const gv = [];
    const av = [];
    const bv = [];
    // Calculate D array
    const minPartitionSize = Math.min(solution.map(val => val.length))
    for (let n = 0; n < Math.floor(minPartitionSize); n += 1) {
        let D = Tools.differenceArray(G, [A, B])
        // Find a from A and b from B such that g = Da + Db - 2*c(a,b) is maximised
        let currentMax = undefined;
        let currentA = -1;
        let currentB = -1;
        // Loop over a's and b's
        for (let ai = 0; ai < A.length; ai += 1) {
            const a = A[ai];
            for (let bi = 0; bi < B.length; bi += 1) {
                const b = B[bi];
                const g = D[a] + D[b] - 2*G.weight(a, b)
                if (
                    (typeof currentMax === 'undefined') || (currentMax < g)
                ) {
                    currentMax = g;
                    currentA = a;
                    currentB = b;
                }
            }
        }
        gv.push(currentMax)
        av.push(currentA)
        bv.push(currentB)
        // Remove a, b from A, B
        A.splice(A.indexOf(currentA), 1)
        B.splice(B.indexOf(currentB), 1)
    }
    // Find k maximising sum of g_0 ... g_k
    const K = [];
    for (let i = 0; i < gv.length; i += 1) {
        K.push(
            (i === 0) ? gv[0] : gv[i] + K[i - 1]
        )
    }
    let currentMax = K[0];
    let currentMaxIndex = 0;
    for (let i = 0; i < K.length; i += 1) {
        if (K[i] > currentMax) {
            currentMax = K[i]
            currentMaxIndex = i;
        }
    }
    const k = currentMaxIndex;
    // Execute swaps 0..k
    if (currentMax > 0) {
        for (let i = 0; i < k + 1; i += 1) {
            // Swap av[i] with bv[i] in solution
            solution[0].splice(solution[0].indexOf(av[i]), 1)
            solution[1].splice(solution[1].indexOf(bv[i]), 1)
            solution[0].push(bv[i])
            solution[1].push(av[i])
        }
    }
    
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
