var config = require("./config");
var logging = require('node-logging');
var request = require("request");
var sendMessage = require("./message_interfaces");
var models = require("./models");
var async = require("async");
var objectMerge = require('object-merge');
var qs = require("qs");
var restify = require("restify")

var uberClient  = function (queryStringData) {
  return restify.createJsonClient({ url: ( "https://api.uber.com/v1/estimates/price" + "?" + qs.stringify(queryStringData) ) })
}

var spawnAsync = function (apiObj, asyncCallback) {
  console.log("in spawn async")
  uberClient(apiObj.parameters).get({}, function (err, request, response, body) {
    var uberResponseBody = body;
    if (err) {
//      console.log(JSON.stringify({request_error: {error: err, api_obj: apiObj}}));
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
//        console.log(JSON.stringify({ worker_done: { api_obj: apiObj}}));
        logging.inf(JSON.stringify({ worker_done: { api_obj: apiObj}}));
        var newApiObj = objectMerge( apiObj, { state: "success", low_estimate: uberResponse.low_estimate, map_link: uberMapLink(apiObj.parameters), msg: function () {
          return ( "Price Now: " + this.low_estimate + " Price desired: " + this.desired_price + "\n" + this.map_link )
              }
        });
        asyncCallback( null, newApiObj );
      }
      else if ( (Number( uberResponse.low_estimate ) > Number( apiObj.desired_price ) ) && jobStillHasTime(apiObj.end_time) ) {
        /* try again */
//        console.log( JSON.stringify( { call_worker_again: {api_obj: apiObj} }) );
        logging.inf( JSON.stringify( { call_worker_again: {api_obj: apiObj} }) );
        setTimeout( function () {
//          console.log("hihi")
          spawnAsync( apiObj, asyncCallback );
        }, config.secsBetweenAsyncSpawns );
      }
      else {
        /* out of time */
        logging.inf( JSON.stringify({ out_of_time: { api_obj: apiObj}}) );
        var newApiObj = objectMerge( apiObj, { state: "timeout", low_estimate: uberResponse.low_estimate, map_link: uberMapLink(apiObj.parameters), msg: function () {
          return ( "Time is up for your request. Current price is: " + this.low_estimate + " Price desired: " + this.desired_price + "\nHere is your link anyways: " + this.map_link )
              }
        });
        asyncCallback( null, newApiObj );
      }
    }
    else {
        /* failed due to a load error */
//        console.log(JSON.stringify({ load_error: { uber_response: uberResponseBody, api_obj: apiObj }}));
        logging.err(JSON.stringify({ load_error: { uber_response: uberResponseBody, api_obj: apiObj }}));
        var newApiObj = objectMerge( apiObj, { state: "uber_api_limit_error" } );
        asyncCallback( null, newApiObj );
    }
  });
};

/* START helpers */
var uberMapLink = function (params) {
  return "https://m.uber.com/sign-up?client_id=" + config.uberClientId + "&pickup_latitude=" + params.start_latitude + "&pickup_longitude=" + params.start_longitude + "&dropoff_latitude=" + params.end_latitude + "&dropoff_longitude=" + params.end_longitude
}

var jobStillHasTime = function (endtime) {
  return ( (Date.parse(endtime) >= Date.now()) ? true : false );
}

var createWorkerData = function (jsonReq) {
  var workerData =  {
        url: "https://api.uber.com/v1/estimates/price",
        parameters: {
          server_token: config.uberServerToken,
          start_latitude: jsonReq.start_latitude,
          start_longitude: jsonReq.start_longitude,
          end_latitude: jsonReq.end_latitude,
          end_longitude: jsonReq.end_longitude
          },
        state: "started",
        end_time: jsonReq.end_time,
        email: jsonReq.email,
        desired_price: jsonReq.desired_price
        };
  return workerData;
}

/* END helpers */

var createWorker = function ( workerData ) {
    console.log( "WorkerData: " + JSON.stringify(workerData) );

   var startWaterFall = function (startWaterfallCallback) {
     console.log("startWaterfall")
     startWaterfallCallback(null, workerData)
   }

    var updateWorkerRecord = function ( data, updateWorkerCallback ) {
      console.log("updateWorkerData")
      console.log(data)
      models.UberRequestJob.update( data.id, { $set: { state: data.state, mail_state: data.mail_state, low_price: data.low_price, map_link: data.map_link } }, function (err, numAffected) {
        if (err){
          updateWorkerCallback(err)
        } else {
          updateWorkerCallback(null, numAffected)
        }
      })
    }

    async.waterfall([startWaterFall, spawnAsync, sendMessage, updateWorkerRecord], function ( err, result) {
      if (err) {
//        console.log(JSON.stringify({create_record_spawn_async_error: {error: err}}))
        logging.err(JSON.stringify({create_worker_spawn_async_error: {error: err}}))
      }
      else {
        console.log("Holy shit a worker completed!!! And the result is " + result + "");
      }
    });
};

module.exports = {createWorker: createWorker,createWorkerData: createWorkerData, models: models};
