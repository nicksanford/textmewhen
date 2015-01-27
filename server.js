var restify = require('restify');
var logging = require('node-logging');
var workers = require("./workers");
var models = workers.models;
var config = require("./config");

var apiServer = restify.createServer({name: "textmewhen"});

var setUpWorkerDataAndCreateWorker = function (req, res) {
  var workerData = workers.createWorkerData(req.params);
  var uberRequestJob = new models.UberRequestJob(workerData);
  uberRequestJob.save(function (err, job) {
    if (err){
      res.send(new restify.UnprocessableEntityError(JSON.stringify(err.errors)));
      logging.err(JSON.stringify(err.errors));
    } else {
      res.send(201);
      workers.createWorker(job.toObject());
    }
  });
};

/* The body parser pre-parses the input as a JSON */
apiServer.use(restify.bodyParser());
apiServer.post("/api/v1/uber", function (req, res, next) {
  logging.inf(JSON.stringify({ params: req.params}));
  new models.UberRequest(req.params).validate(function (err) {
    if (err) {
      logging.err(JSON.stringify(err.errors));
      res.send(new restify.UnprocessableEntityError(JSON.stringify(err.errors)));
    } else {
      setUpWorkerDataAndCreateWorker(req, res);
    }
  });
});

module.exports = apiServer;
