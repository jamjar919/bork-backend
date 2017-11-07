/* eslint-disable */
import Graph from './graph';
import { brute, fillGraph} from './solvers';
import { permute,isValidPartition, calculatePartition, splitArray, randomGraph, intArray } from './tools.js';

// const G = new Graph(5);
// G.load([
//     [0,2,3,0,0],
//     [1,0,1,1,2],
//     [0,0,0,0,5],
//     [0,4,1,0,0],
//     [0,5,0,0,0],
// ]);


const G = randomGraph(20, -5, 10);
console.log(G);
let best = undefined;
let bestSol = [];
let worst = 0;
let worstSol = [];
for (let i = 0; i < 100; i += 1) {
    const sol = fillGraph(G, 3);
    const cut = calculatePartition(G, sol);
    if (cut > worst) {
        worst = cut;
        worstSol = sol;
    }
    if ((cut < best) || !best) {
        best = cut;
        bestSol = sol;
    }
}
console.log('best solution', bestSol, 'with weight', best);
console.log('worst solution', worstSol, 'with weight', worst);