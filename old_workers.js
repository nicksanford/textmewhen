var config = require("./config");
var logging = require('node-logging');
var request = require("request");
var sendMessage = require("./message_interfaces");
var dbWrapper = require("./models");
var async = require("async");
var objectMerge = require('object-merge');
var schema = require("./schema");
var validation = require("./validations");

var spawnAsync = function (apiObj, asyncCallback) {
  request({url:apiObj.url, qs:apiObj.parameters}, function (err, response, body) {
    var uberResponseBody = body ? JSON.parse(body) : {};
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
          return ( "Price Now: " + this.low_estimate + " Price desired: " + this.desired_price + "\n" + this.map_link )
              }
        });
        asyncCallback( null, newApiObj );

      }
      else if ( (Number( uberResponse.low_estimate ) > Number( apiObj.desired_price ) ) && jobStillHasTime(apiObj.end_time) ) {
        /* try again */
        logging.inf( JSON.stringify( { call_worker_again: {api_obj: apiObj} }) );
        setTimeout( function () {
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
          start_latitude: jsonReq.start_lat,
          start_longitude: jsonReq.start_lon,
          end_latitude: jsonReq.end_lat,
          end_longitude: jsonReq.end_lon
          },
        state: "started",
        end_time: jsonReq.end_time,
        email: jsonReq.email,
        desired_price: jsonReq.desired_price
        };
  return workerData;
}

/* END helpers */

var createWorker = function ( rawReq, response ) {
  var validJson = validation.isJsonString(rawReq);
  if ( validJson && validation.passesValidations(schema, validJson) ){
    endResponse(response, { code: 200 })
    var workerData = createWorkerData( validJson );
    createRecordSpawnAsync( workerData );
  }
  else {
    var reqErrors = validJson ? validation.validationErrors(schema, validJson) : "Request must be made with json"
    endResponse(response, { code: 400, errors: reqErrors })
    logging.err(JSON.stringify({param_error: {error: reqErrors, raw_req: rawReq}}));
  }
};

var endResponse = function (response, data) {
  if (response) {
    response.writeHead( data.code, { "content-type": "application/json" } );
    response.end();
    return true;
  }
  else {
    response.writeHead( data.code, { "content-type": "application/json" } );
    response.end();
    return false;
  }
};

var createRecordSpawnAsync = function ( workerData ) {
  console.log( workerData );
  var createWorkerRecord = function (createWorkerCallback) {
    dbWrapper( "create", workerData, createWorkerCallback);
  }

  var updateWorkerRecord = function ( data, updateWorkerCallback ) {
    dbWrapper( "update", data, updateWorkerCallback);
  }

  async.waterfall([createWorkerRecord, spawnAsync, sendMessage, updateWorkerRecord], function ( err, result) {
    if (err) {
      logging.err(JSON.stringify({create_record_spawn_async_error: {error: err}}))
    }
    else {
      console.log("Holy shit a worker completed!!!");
    }
  });
}

module.exports = createWorker;
