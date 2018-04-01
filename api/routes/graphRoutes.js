'use strict';
module.exports = function(app) {
  var graphs = require('../controllers/graphController');

  app.route('/api/graphs')
    .get(graphs.list_all)
    .post(graphs.create);


  app.route('/api/graphs/:graphId')
    .get(graphs.get)
    .post(graphs.updateEdge)
    .delete(graphs.delete)
    .options((req, res) => { res.send("200 OK\nAllow: GET,POST,DELETE,OPTIONS") });

  app.route('/api/graphs/:graphId/names')
    .get(graphs.getNames)
    .post(graphs.setNames)
  
  app.route('/api/graphs/:graphId/solve')
    .get(graphs.solve)
};
