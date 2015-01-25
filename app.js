var workers = require("./workers");
var config = require("./config");
var fs = require("fs");
var restify = require('restify');
var logging = require('node-logging');
var models = workers.models;

var restifyServer = restify.createServer({});

var setUpWorkerDataAndCreateWorker = function (req, res) {
  var workerData = workers.createWorkerData(req.params)
  var uberRequestJob = new models.UberRequestJob(workerData)
  uberRequestJob.save(function (err, job) {
    if (err){
      res.send(new restify.UnprocessableEntityError(JSON.stringify(err.errors)))
      logging.err(JSON.stringify(err.errors))
    } else {
      res.send(200)
      workers.createWorker(job.toObject())
    }
  })
}
/* The body parser pre-parses the input as a JSON */
/* TEST WHAT HAPPENS IF THE INPUT IS NOT VALID JSON */
restifyServer.use(restify.bodyParser());
restifyServer.post("/api/v1/uber", function (req, res, next) {
  console.log("Params: " + JSON.stringify(req.params))
  new models.UberRequest(req.params).validate(function (err) {
    if (err) {
      logging.err(JSON.stringify(err.errors))
      res.send(new restify.UnprocessableEntityError(JSON.stringify(err.errors)))
    } else {
      setUpWorkerDataAndCreateWorker(req, res)
    }
  })
});

restifyServer.listen( config.port );
