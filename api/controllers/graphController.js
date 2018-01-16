'use strict';

const Graph = require('../graph');
const Solver = require('../solvers');
const Tools = require('../tools')

var mongoose = require('mongoose'),
GraphModel = mongoose.model('Graph');

exports.list_all = function(req, res) {
    GraphModel.find({}, function(err, graphs) {
        if (err)
            res.send(err);
        res.json(graphs);
    });
};

exports.create = function(req, res) {
    console.log(req.body);
    if (req.body.size) {
        const size = parseInt(req.body.size);
        const row = [];
        for (let i = 0; i < size; i += 1) {
            row.push(0);
        }
        const data = [];
        for (let i = 0; i < size; i += 1) {
            const copy = Object.assign([], row);
            data.push(copy);
        }
        var new_graph = new GraphModel({
            name: req.body.name,
            owner: req.body.owner,
            data: data,
        });
        console.log(new_graph);
        new_graph.save(function(err, graph) {
        if (err)
            res.send(err);
        res.json(graph);
    });
    } else {
        res.send("Specify a size");
    }

};

exports.get = function(req, res) {
    GraphModel.findById(req.params.graphId, function(err, graph) {
        if (err)
            res.send(err);
        res.json(graph);
    });
};

exports.solve = function(req, res) {
    if (req.query.method) {
        GraphModel.findById(req.params.graphId, function(err, graph) {
            const G = new Graph(graph.data.length);
            G.load(graph.data);
            let solution;
            switch(req.query.method){
                case "fill":
                    let best = undefined;
                    let bestSol = [];
                    let worst = 0;
                    let worstSol = [];
                    for (let i = 0; i < 100; i += 1) {
                        const sol = Solver.fillGraph(G, 2, true);
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
                    break;
                case "coarsegrow":
                    solution = Solver.coarseGrow(G, 2);
                    break;
                default:
                    res.json({"error": 'Solve method not found'});
            }
            const response = {
                solution: solution,
                graph: graph,
            };
            res.json(response);
        });
    } else {
        res.send("Please select a method");
    }
}

exports.updateEdge = function(req, res) {
    if (
        req.body.from > -1 &&
        req.body.to > -1 &&
        Object.hasOwnProperty.call(req.body, 'value')
    ) {
        GraphModel.findById(req.params.graphId, function(err, graph) {
            if (err) {
                res.send(err);
            } else {
                const from = parseInt(req.body.from);
                const to = parseInt(req.body.to);
                const value = parseInt(req.body.value);               
                if (
                    typeof graph.data[from] !== "undefined" &&
                    typeof graph.data[from][to] !== "undefined"
                ) {
                    graph.data[from][to] = value;
                    GraphModel.findOneAndUpdate({_id: req.params.graphId}, graph, {new: true}, function(err, graph) {
                        if (err)
                            res.send(err);
                        res.send(graph);
                    })
                } else {
                    res.send('Invalid indexes specified, provide a value from 0-'+(graph.data.length-1));
                }
            }
        });
    } else {
        res.send("Please specify from, to, and value")
    }
}

exports.delete = function(req, res) {
    GraphModel.remove({
        _id: req.params.graphId
    }, function(err, graph) {
        if (err)
            res.send(err);
        res.json({ message: 'GraphModel successfully deleted' });
    });
};

