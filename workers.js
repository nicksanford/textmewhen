var logging = require('node-logging');
var async = require("async");
var objectMerge = require('object-merge');
var qs = require("qs");
var restify = require("restify");
var ObjectID = require('mongodb').ObjectID;
var sendMessage = require("./message_interfaces");
var models = require("./models");
var config = require("./config");

var uberClient  = function (queryStringData) {
  return restify.createJsonClient({ url: ( "https://api.uber.com/v1/estimates/price" + "?" + qs.stringify(queryStringData) ) });
};

var spawnAsync = function (apiObj, asyncCallback) {
  uberClient(apiObj.parameters).get({}, function (err, request, response, body) {
    var uberResponseBody = body;
    if (err) {
      logging.err(JSON.stringify({request_error: {error: err, api_obj: apiObj}}));
      var newApiObj = objectMerge( apiObj, { state: "request_error" } );
      asyncCallback(null, newApiObj );
    }
    /* This is needed if too many requests are made and the uber api blacklists us
       for a time. In that case there will be an uberResponseBody, but it will 
       not have a 'prices' key
    */
    else if (uberResponseBody.prices) {
      var uberResponse = uberResponseBody.prices[0];
      if (Number( uberResponse.low_estimate ) <= Number( apiObj.desired_price ) ) {
        /* success */
        logging.inf(JSON.stringify({ worker_done: { api_obj: apiObj}}));
        var newApiObj = objectMerge( apiObj, { state: "success", low_estimate: uberResponse.low_estimate, map_link: uberMapLink(apiObj.parameters), msg: function () {
          return ( "Price Now: " + this.low_estimate + " Price desired: " + this.desired_price + "\n" + this.map_link );
              }
        });
        asyncCallback( null, newApiObj );
      }
      else if ( (Number( uberResponse.low_estimate ) > Number( apiObj.desired_price ) ) && jobStillHasTime(apiObj.created_at) ) {
        /* try again */
        setTimeout(function () {
          spawnAsync( apiObj, asyncCallback );
        }, config.milliSecsBetweenAsyncSpawns );
      }
      else {
        /* out of time */
        logging.inf( JSON.stringify({ out_of_time: { api_obj: apiObj}}) );
        var newApiObj = objectMerge( apiObj, { state: "timeout", low_estimate: uberResponse.low_estimate, map_link: uberMapLink(apiObj.parameters), msg: function () {
          return ( "Time is up for your request. Current price is: " + this.low_estimate + " Price desired: " + this.desired_price + "\nHere is your link anyways: " + this.map_link );
              }
        });
        asyncCallback( null, newApiObj );
      }
    }
    else {
        /* failed due to a load error */
        logging.err(JSON.stringify({ load_error: { uber_response: uberResponseBody, api_obj: apiObj }}));
        var newApiObj = objectMerge( apiObj, { state: "uber_api_limit_error" } );
        asyncCallback( null, newApiObj );
    }
  });
};

/* START helpers */
var uberMapLink = function (params) {
  return "https://m.uber.com/sign-up?client_id=" + config.uberClientId + "&pickup_latitude=" + params.start_latitude + "&pickup_longitude=" + params.start_longitude + "&dropoff_latitude=" + params.end_latitude + "&dropoff_longitude=" + params.end_longitude;
};

var jobStillHasTime = function (createdAt) {
  /* This adds the # of timeoutMinutes in the config to the createdAt date and checks to see if it has past */
  var endTime = new Date( ((new Date(Date.parse(createdAt))).getTime() + config.timoutMinutes*60000 ))
  return ( ( endTime >= Date.now() ) ? true : false );
};

var createWorkerData = function (jsonReq) {
  var workerData =  {
        parameters: {
          start_latitude: jsonReq.start_latitude,
          start_longitude: jsonReq.start_longitude,
          end_latitude: jsonReq.end_latitude,
          end_longitude: jsonReq.end_longitude
          },
        email: jsonReq.email,
        desired_price: jsonReq.desired_price
        };
  return workerData;
};

/* END helpers */

var createWorker = function ( workerData ) {
  var startWaterFall = function (startWaterfallCallback) {
    startWaterfallCallback(null, workerData);
  };

  var updateWorkerRecord = function ( data, updateWorkerCallback ) {
    var setQuery = function () {
      return (data.state === "request_error") ? { $set: { state: data.state, updated_at: (new Date().toISOString()) } } : { $set: { state: data.state, mail_state: data.mail_state, low_estimate: data.low_estimate, map_link: data.map_link, updated_at: (new Date().toISOString()) } };
    };
    models.UberRequestJob.findByIdAndUpdate( new ObjectID(data._id.id), setQuery(), function (err, result) {
      if (err){
        updateWorkerCallback(err);
      } else {
        updateWorkerCallback(null, result);
      }
    });
  };

  async.waterfall([startWaterFall, spawnAsync, sendMessage, updateWorkerRecord], function ( err, result) {
    if (err) {
      logging.err(JSON.stringify({create_worker_spawn_async_error: {error: err}}));
    }
    else {
      logging.inf(JSON.stringify({ completed: result }));
    }
  });
};

module.exports = {createWorker: createWorker,createWorkerData: createWorkerData, models: models};
