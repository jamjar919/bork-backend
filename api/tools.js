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

