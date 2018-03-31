const Graph = require('./graph');

module.exports.getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - (min + 1))) + min;
}

module.exports.intArray = (min, max) => {
    if (max < min) {
        return [];
    }
    const result = [];
    for (let i = min; i < max; i += 1) {
        result.push(i);
    }
    return result;
}

module.exports.addArray = (a1, a2) => {
    if (a1.length < a2.length) {
        throw Error('a1 should be bigger than a2, sized wrong');
    }
    const result = Object.assign([], a1);
    for (let i = 0; i < a1.length; i += 1) {
        result[i] += a2[i];
    }
    return result;
}

module.exports.permute = (array) => {
    if (array.length === 1) {
        return array;
    }
    const results = [];
    for (let i = 0; i < array.length; i += 1) {
        const arrcopy = Object.assign([], array);
        const el = [arrcopy[i]];
        arrcopy.splice(i, 1);
        const endings = module.exports.permute(arrcopy);
        for (let j = 0; j < endings.length; j += 1) {
            const p = el.concat(endings[j]);
            results.push(p);
        }
    }
    return results;
}

module.exports.splitArray = (array, index) => {
    return [
        array.slice(0, index),
        array.slice(index),
    ];
}

module.exports.flattenPartition = (partition) => {
    let result = [];
    for (let i = 0; i < partition.length; i += 1) {
        result = result.concat(partition[i]);
    }
    return result;
}

module.exports.isValidPartition = (G, partition) => {
    // A partition is valid if it contains all the numbers from 0 - G.size - 1
    const flat = module.exports.flattenPartition(partition);
    for (let i = 0; i < G.size; i += 1) {
        const index = flat.indexOf(i);
        if (index === -1) {
            // We didn't find it in the array
            return false;
        }
        flat.splice(index, 1);
    }
    if (flat.length !== 0) {
        // We removed all numbers and the partition still has something in
        return false;
    }
    return true;
}

module.exports.randomGraph = (size, min = 0, max = 5) => {
    const G = new Graph(size);
    for (let i = 0; i < size; i += 1) {
        for (let j = 0; j < size; j += 1) {
            G.weight(
                i, j,
                getRandomInt(min, max)
            );
        }
    }
    return G;
}

module.exports.calculatePartition = (G, partition) => {
    // G is a graph, partition is an array of the form [[0,1,2],[3,4],...[9,10]]
    // where each subarray is a partition
    if (module.exports.isValidPartition(G, partition)) {
        let sum = 0;
        for (let i = 0; i < partition.length; i += 1) {
            for (let j = 0; j < partition[i].length; j += 1) {
                for (let k = 0; k < G.size; k += 1) {
                    if (!(partition[i].indexOf(k) > -1)) {
                        sum += G.weight(partition[i][j], k);
                    }
                }
            }
        }
        return sum;
    }
    throw Error('Invalid partition of graph');
}

module.exports.getSizes = (size, n) => {
    // Sizes partitions based on the an even split between the size of the graph
    // and the number of partitions
    const sizes = [];
    const partitionSize = Math.max(Math.floor(size/n), 1);
    while(
        (sizes.length + 1 < n)
    ) {
        sizes.push(partitionSize)
    }
    if (sizes.reduce((a, b) => (a + b), 0) !== size) {
        sizes.push(size - sizes.reduce((a, b) => (a + b), 0))
    }
    return sizes;
}

module.exports.heavyEdges = (G, filter = 0.25) => {
    const edgeList = G.edges();
    if (edgeList.length < 1) {
        return [];
    }
    // Calculate average and obtain all above that average
    let average = 0;
    for (let i = 0; i < edgeList.length; i += 1) {
        const edge = edgeList[i];
        average = average + edge["weight"];
    }
    average = average / edgeList.length;
    // Create limit to make a parameterised list
    const limit = Math.floor(edgeList[0]["weight"] - (average * filter));
    const heavy = [];
    let i = 0;
    while ((i < edgeList.length) && (edgeList[i]["weight"] > limit)) {
        heavy.push(edgeList[i]);
        i += 1
    }
    return heavy;
}

module.exports.internalEdges = (G, partition, returnArray = false) => {
    // Count the weight of the internal edges of a partition
    let sum = 0;
    let array = [];
    for (let i = 0; i < partition.length; i += 1) {
        const from = partition[i];
        array.push(0)
        for (let j = 0; j < partition.length; j += 1) {
            const to = partition[j];
            array[i] += G.weight(from, to)
            sum += G.weight(from, to)
        }
    }
    if (returnArray)
        return array;
    return sum;
}

module.exports.externalEdges = (G, partition, returnArray = false) => {
    // Count the edges from a partition to the rest of the graph
    let sum = 0;
    const array = [];
    // Create a mapping to speed up lookup
    const inPartition = [];
    for (let i = 0; i < G.size; i += 1) {
        inPartition.push(
            partition.indexOf(i) !== -1
        )
    }
    for (let i = 0; i < partition.length; i += 1) {
        const from = partition[i]
        array.push(0)
        for (let j = 0; j < G.size; j += 1) {
            const to = j;
            if (!inPartition[j]) {
                array[i] += G.weight(from, to)
                sum += G.weight(from, to)
            }
        }
    }
    if (returnArray)
        return array;
    return sum;
}

module.exports.differenceArray = (G, solution) => {
    // Produce difference array for Kernighan Lin
    // Create a mapping to speed up lookup
    const partition = [];
    for (let i = 0; i < G.size; i += 1) {
        partition.push(
            (solution[0].indexOf(i) !== -1) ? 0 : 1
        )
    }
    const D = []
    for (let node = 0; node < G.size; node += 1) {
        // Calculate internal/external cost
        let internal = 0;
        let external = 0;
        for (let to = 0; to < G.size; to += 1) {
            if (partition[to] === partition[node]) {
                internal += G.weight(node, to)
            } else {
                external += G.weight(node, to)
            }
        }
        D.push(external - internal)
    }
    return D;
}

module.exports.connectedComponents = (G) => {
    const visited = [];
    for (let i = 0; i < G.size; i += 1) {
        visited.push(false)
    }
    const components = [];
    const currentNode = 0;
    // While we haven't visited all nodes
    while (!visited.reduce((a, val) => a && val, true)) {
        // Pick a node to visit from G that we haven't already visited
        const toVisit = [];
        for (let i = 0; i < G.size; i += 1) {
            if (!visited[i]) {
                toVisit.push(i)
                break;
            }
        }
        // Build the component around that node
        const currentComponent = [];
        while (toVisit.length !== 0) {
            const from = toVisit.pop();
            currentComponent.push(from)
            visited[from] = true
            // Add neighbours of the node to toVisit (unless we've been there already)
            for (let to = 0; to < G.size; to += 1) {
                if (
                    (!visited[to]) &&
                    (G.weight(from, to) > 0) 
                ) {
                    visited[to] = true
                    toVisit.push(to)
                }
            }
        }
        components.push(currentComponent);
    }
    return components;
} 
