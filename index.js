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

app.use(express.static('public'));

// Setup body-parser to serve json
app.use('/api', bodyParser.urlencoded({ extended: true }));
app.use('/api', bodyParser.json());

// Add headers to the API calls
app.use('/api',function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Setup routes for the app
var routes = require('./api/routes/graphRoutes');
routes(app);

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
});

app.listen(port);


console.log('server started on: ' + port);
