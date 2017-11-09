'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var GraphSchema = new Schema({
  name: {
    type: String,
    required: 'Graph name required'
  },
  owner: {
    type: String,
    required: 'Please define the owner of this plan',
  },
  data: {
    type: [[]], 
    required: 'Please supply an empty array of the required size'
  },
  names: {
    type: [String],
  },
  created: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Graph', GraphSchema);
