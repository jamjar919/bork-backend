/** Representation of a graph in adjacency matrix format */

let G = class Graph {
    constructor(numberOfVertices) {
        this.matrix = [];
        this.size = numberOfVertices;
        const row = [];
        for (let i = 0; i < numberOfVertices; i += 1) {
            row.push(0);
        }
        for (let i = 0; i < numberOfVertices; i += 1) {
            // deepcopy to destroy object reference
            const copy = Object.assign([], row);
            this.matrix.push(copy);
        }
    }
    weight(from, to, value) {
        if (typeof value !== 'undefined') {
            this.matrix[from][to] = value;
        }
        return this.matrix[from][to];
    }
    adjacent(vertex) {
        const result = [];
        for (let i = 0; i < this.matrix[vertex].length; i += 1) {
            if (this.matrix[vertex][i] !== 0) {
                result.push(i);
            }
        }
        return result;
    }
    total(vertex) {
        let sum = 0;
        for (let i = 0; i < this.matrix[vertex].length; i += 1) {
            sum += this.matrix[vertex][i];
        }
        return sum;
    }
    load(array) {
        if (array.length === this.size) {
            if (array[0].length === this.size) {
                this.matrix = Object.assign([], array);
                return;
            }
        }
        throw Error('Array not of same size');
    }
    neighbours(node) {
        return Object.assign([], this.matrix[node]);
    }
}

module.exports = G;
