'use strict';

var mongoose = require('mongoose'),
Graph = mongoose.model('Graph');

exports.list_all = function(req, res) {
    Graph.find({}, function(err, graphs) {
        if (err)
            res.send(err);
        res.json(graphs);
    });
};

exports.create = function(req, res) {
    var new_graph = new Graph(req.body);
        new_graph.save(function(err, graph) {
        if (err)
            res.send(err);
        res.json(graph);
    });
};

exports.get = function(req, res) {
    Graph.findById(req.params.graphId, function(err, graph) {
        if (err)
            res.send(err);
        res.json(graph);
    });
};

exports.update = function(req, res) {
    Graph.findOneAndUpdate({_id: req.params.graphId}, req.body, {new: true}, function(err, graph) {
        if (err)
            res.send(err);
        res.json(graph);
    });
};

exports.delete = function(req, res) {
    Graph.remove({
        _id: req.params.graphId
    }, function(err, graph) {
        if (err)
            res.send(err);
        res.json({ message: 'Graph successfully deleted' });
    });
};

