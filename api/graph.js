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
        if (from === to) {
            // For purposes of solving, we can consider these to not exist
            return 0;
        }
        if (typeof value !== 'undefined') {
            this.matrix[from][to] = value;
        }
        return this.matrix[from][to] + this.matrix[to][from];
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
    edges() {
        const edges = [];
        for (let a = 0; a < this.size; a += 1) {
            for (let b = 0; b < this.size; b += 1) {
                if (this.matrix[a][b] !== 0) {
                    edges.push({
                        from: a,
                        to: b,
                        weight: this.weight(a, b),
                    });
                }
            }
        }
        edges.sort((a, b) => (b['weight'] - a['weight']));
        return edges;
    }
    deleteNode(node) {
        // Remove references to the node
        for (let i = 0; i < this.size; i += 1) {
            this.matrix[i].splice(node, 1);
        }
        // Remove the row
        this.matrix.splice(node, 1); 
        this.size = this.size - 1;
    }
    addNode() {
        for (let i = 0; i < this.size; i += 1) {
            this.matrix[i][this.size] = 0;
        }
        this.size = this.size + 1;  
        const row = [];
        for (let i = 0; i < this.size; i += 1) {
            row.push(0);
        }
        this.matrix.push(row);
        return this.size - 1;
    }
    copyEdges(from, to) {
        // Copy edges from one node to another, both directions
        // Does not overwrite existing edges
        const neighbours = this.neighbours(from);
        // Copy to -> nodes
        for (let i = 0; i < this.size; i += 1) {
            this.matrix[to][i] = neighbours[i] + this.matrix[to][i];
        }
        // Copy nodes -> to
        for (let i = 0; i < this.size; i += 1) {
            this.matrix[i][to] = this.matrix[i][from] + this.matrix[i][to];
        }
    }
    copy() {
        // Copy the graph object, and return a new graph
        const G_dash = new Graph(this.size);
        const matrix_dash = [];
        for (let i = 0; i < this.size; i += 1) {
            matrix_dash.push(
                Object.assign([], this.matrix[i])
            )
        }
        G_dash.load(matrix_dash);
        return G_dash;
    }
}

module.exports = G;
