/* eslint-disable */
const stringify = require('csv-stringify/lib/sync')
const perfy = require('perfy');
const fs = require('fs');

const Graph = require('./graph');
const Solver = require('./solvers');
const Tools = require('./tools.js');

const NUM_TEST = 100;
const n = 2;
const SIZE = 100;
const sizes = Tools.getSizes(SIZE, n)

// Generate partition graphs
const graphs = [];
const mincut = [];
console.log("genning graphs")
for (let i = 0; i < NUM_TEST; i += 1) {
    const a = Tools.placedGraph(SIZE);
    graphs.push(a[0]);
    mincut.push(a[1])
}
console.log("made ",NUM_TEST," graphs")

console.log("graph filling")
const graphFillingResults = [];
const graphFillingTimes = [];
for (let i = 0; i < NUM_TEST; i += 1) {
    try {
        perfy.start(i+'fill');
        const G = graphs[i].copy();

        console.log(i)

        // fill code
        let best = undefined;
        let bestSol = [];
        let worst = 0;
        let worstSol = [];
        for (let i = 0; i < 100; i += 1) {
            const sol = Solver.simplify(G, n, sizes, Solver.fillGraph);
            const cut = Tools.calculatePartition(G, sol);
            if (cut > worst) {
                worst = cut;
                worstSol = sol;
            }
            if ((cut < best) || !best) {
                best = cut;
                bestSol = sol;
            }
        }
        solution = bestSol;
        solution = Solver.partitionResizer(G, solution, sizes);

        const weight = Tools.calculatePartition(G, solution);
        graphFillingResults.push(weight);
        const time = perfy.end(i+'fill').milliseconds;
        graphFillingTimes.push(time)
    } catch(err) {
        graphFillingResults.push("err")
        console.log("error on graph",i," message is",err.message)
    }
}
console.log("graph filling done")

console.log("coarsegrow")
const coarseGrowResults = [];
const coarseGrowTimes = [];

for (let i = 0; i < NUM_TEST; i += 1) {
    try {
        perfy.start(i+'coarsegrow');
        const G = graphs[i].copy();

        solution = Solver.simplify(G, n, sizes, Solver.coarseGrow);

        const weight = Tools.calculatePartition(G, solution);
        coarseGrowResults.push(weight);
        const time = perfy.end(i+'coarsegrow').milliseconds;
        coarseGrowTimes.push(time)
    } catch(err) {
        coarseGrowResults.push("err")
        console.log("error on graph",i," message is",err.message)
    }
}
console.log("coarsegrow done")

console.log("spectral")
const spectralResults = [];
const spectralTimes = [];
for (let i = 0; i < NUM_TEST; i += 1) {
    try {
        perfy.start(i+'spectral');
        const G = graphs[i].copy();

        solution = Solver.simplify(G, n, sizes, Solver.spectral);

        const weight = Tools.calculatePartition(G, solution);
        spectralResults.push(weight);
        const time = perfy.end(i+'spectral').milliseconds;
        spectralTimes.push(time)
    } catch(err) {
        spectralResults.push("err")
        console.log("error on graph",i," message is",err.message)
    }
}
console.log("spectral done")

// write results
const graphId = Tools.intArray(0, NUM_TEST);
// console.log(graphId)

// console.log(mincut)
// console.log(graphFillingResults)
// console.log(coarseGrowResults)
// console.log(spectralResults)

// console.log("times")
// console.log(graphFillingTimes)
// console.log(coarseGrowTimes)
// console.log(spectralTimes)

const doc = [
    graphId,
    mincut,
    graphFillingResults,
    graphFillingTimes,
    coarseGrowResults,
    coarseGrowTimes,
    spectralResults,
    spectralTimes,
];

let thec = "";
thec += "ID,Minimum,GraphFill,GraphFillTime,CoarseGrow,CoarseGrowTime,Spectral,SpectralTime\n";
for (let row = 0; row < graphId.length; row += 1) {
    thec += `${graphId[row]},${mincut[row]},${graphFillingResults[row]},${graphFillingTimes[row]},${coarseGrowResults[row]},${coarseGrowTimes[row]},${spectralResults[row]},${spectralTimes[row]}\n`
}

console.log(thec)
fs.writeFile('output.csv', thec, (err) => {
    if (err) throw err;
    console.log('csv saved.');
});
