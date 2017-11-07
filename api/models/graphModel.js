'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var GraphSchema = new Schema({
  name: {
    type: String,
    required: 'Graph name required'
  },
  Created_date: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Graph', GraphSchema);
