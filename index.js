var express = require('express'),
app = express(),
port = process.env.PORT || 3000,
mongoose = require('mongoose'),
Graph = require('./api/models/graphModel'),
bodyParser = require('body-parser');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/graphdb', {
    useMongoClient: true,
}); 

// Setup body-parser to serve json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup routes for the app
var routes = require('./api/routes/graphRoutes');
routes(app);

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

app.listen(port);


console.log('server started on: ' + port);