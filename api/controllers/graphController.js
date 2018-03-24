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
        const names = []
        for (let i = 0; i < size; i += 1) {
            names.push(`Node ${i.toString()}`)
        }
        var new_graph = new GraphModel({
            name: req.body.name,
            owner: req.body.owner,
            data: data,
            names: names,
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
            let error = false;
            // Set n and sizes based on params
            let n = 0;
            let sizes = undefined;
            if (parseInt(req.query.n)) {
                n = parseInt(req.query.n);
            }
            if (req.query.sizes) {
                req.query.sizes = req.query.sizes.map((x) => parseInt(x));
                if (req.query.sizes.length === n) {
                    if (req.query.sizes.reduce((a,b)=>a+b, 0) === G.size) {
                        sizes = req.query.sizes;
                    } else {
                        error = true;
                        res.json({ error: 'Sizes supplied don\'t match up with the size of the graph' })
                    }
                } else {
                    error = true;
                    res.json({ error: 'Sizes supplied don\'t match up with the number of partitions' })
                }
            } else {
                // Make sizes based on n
                sizes = Tools.getSizes(G.size, n)
            }
            if (!error) {
                switch(req.query.method){
                    case "fill":
                        console.log("Using Fill")
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
                        break;
                    case "coarsegrow":
                        console.log("Using CoarseGrow")
                        const maxSize = Math.max(...sizes);
                        solution = Solver.simplify(G, n, sizes, Solver.coarseGrow, [maxSize]);
                        break;
                    case "spectral":
                        solution = Solver.simplify(G, n, sizes, Solver.spectral, [true]);
                        break;
                    default:
                        error = true;
                        res.json({"error": 'Solve method not found'});
                }
                if (!error) {
                    const response = {
                        solution: solution,
                        graph: graph,
                    };
                    res.json(response);
                }
            }
        });
    } else {
        res.json({error:"Please select a method"});
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
            res.json({ success: false, error: err });
        res.json({ success: true, message: 'GraphModel successfully deleted' });
    });
};

exports.getNames = (req, res) => {
    GraphModel.findById(req.params.graphId, function(err, graph) {
        if (err) {
            res.send(err);
        }
        res.json({ names: graph.names })
    });
}

exports.setNames = (req, res) => {
    if (
        req.body.id > -1 &&
        Object.hasOwnProperty.call(req.body, 'name')
    ) {
        GraphModel.findById(req.params.graphId, function(err, graph) {
            if (err) {
                res.send(err);
            }
            const value = req.body.name;               
            const id = parseInt(req.body.id); 
            if (
                (value) 
            ) {
                graph.names[id] = value;
                GraphModel.findOneAndUpdate({_id: req.params.graphId}, graph, {new: true}, function(err, graph) {
                    if (err)
                        res.send(err);
                    res.send(graph);
                });
            }
        });
    } else {
        res.json({'error':'Please supply an id in range, and a name'})
    }
}
