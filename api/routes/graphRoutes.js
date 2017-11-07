'use strict';
module.exports = function(app) {
  var graphs = require('../controllers/graphController');

  app.route('/api/graphs')
    .get(graphs.list_all)
    .post(graphs.create);


  app.route('/api/graphs/:graphId')
    .get(graphs.get)
    .put(graphs.update)
    .delete(graphs.delete);
};
