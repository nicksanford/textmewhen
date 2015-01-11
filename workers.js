var config = require("./config");
var logging = require('node-logging');
var request = require("request");
var sendMessage = require("./message_interfaces");
var dbWrapper = require("./models");
var async = require("async");
var objectMerge = require('object-merge');

/*var JaySchema = require('jayschema');*/
/*var js = new JaySchema();*/

var isJsonString = function (str) {
  try {
    var parsedJson = JSON.parse(str);
    if (parsedJson && typeof parsedJson === "object" && parsedJson !== null) {
      return parsedJson;
    }
  } catch (e) {
    return false;
  }
  return false;
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

var spawnAsync = function (apiObj, asyncCallback) {
  request({url:apiObj.url, qs:apiObj.parameters}, function (err, response, body) {
    var uberResponseBody = body ? JSON.parse(body) : {};
    if (err) {
      logging.err(JSON.stringify({request_error: {error: err, api_obj: apiObj}}));
      // update mongo that the job failed due to a request_error with the timestamp
      var newApiObj = objectMerge( apiObj, { state: "request error" } );
      asyncCallback(null, apiObj);
    }
    /* This is needed if too many requests are made and the uber api blacklists us
       for a time. In that case there will be an uberResponseBody, but it will 
       not have a 'prices' key
    */
    else if (uberResponseBody.prices) {
      var uberResponse = uberResponseBody.prices[0];
      if (Number( uberResponse.low_estimate ) <= Number( apiObj.desired_price ) ) {
        /* success */

        var msg = ( "Price Now: " + uberResponse.low_estimate + " Price desired: " + apiObj.desired_price + "\n" + uberMapLink(apiObj.parameters) );
        logging.inf(JSON.stringify({ worker_done: {msg: msg, api_obj: apiObj}}));
        // update mongo that the req has been sadisfied with the timestamp
        sendMessage(apiObj.email, msg);
        var newApiObj = objectMerge( apiObj, { state: "completed" } );
        asyncCallback( null, newApiObj );

      }
      else if ( (Number( uberResponse.low_estimate ) > Number( apiObj.desired_price ) ) && jobStillHasTime(apiObj.end_time) ) {
        /* try again*/
        logging.inf( JSON.stringify( { call_worker_again: {api_obj: apiObj} }) );
        setTimeout( function () {
          spawnAsync( apiObj, asyncCallback );
        }, config.secsBetweenAsyncSpawns );
      }
      else {
        /* out of time */
        // update mongo that the req has failed due to timeout with the timestamp
        var msg = ( "Time is up for your request. Current price is: " + uberResponse.low_estimate + " Price desired: " + apiObj.desired_price + "Time: " + Date.now() + "End time: " + apiObj.end_time + "\nHere is your link anyways: " + uberMapLink(apiObj.parameters)  );
        logging.inf( JSON.stringify({ out_of_time: {msg: msg, api_obj: apiObj}}) );
        sendMessage(apiObj.email, msg);

        var newApiObj = objectMerge( apiObj, { state: "timeout" } );
        asyncCallback( null, newApiObj );
      }
    }
    else {
        // update mongo that the req has failed due to a load errror with the timestamp
        var msg = ( "Our service is under heavy load. Like your mom heavy.  Sorry for the inconvenience. Please try again later." );
        logging.err(JSON.stringify({ load_error: {msg: msg, uber_response: uberResponseBody, api_obj: apiObj }}));
        sendMessage(apiObj.email, msg);
        var newApiObj = objectMerge( apiObj, { state: "exceeded uber api limit error" } );
        asyncCallback( null, newApiObj );
    }
  });
};

// START helpers
var uberMapLink = function (params) {
  return "https://m.uber.com/sign-up?client_id=" + config.uberClientId + "&pickup_latitude=" + params.start_latitude + "&pickup_longitude=" + params.start_longitude + "&dropoff_latitude=" + params.end_latitude + "&dropoff_longitude=" + params.end_longitude
}

var jobStillHasTime = function (endtime) {
  return ( (Date.parse(endtime) >= Date.now()) ? true : false );
}
// END helpers

var createRecordSpawnAsync = function ( workerData ) {
  console.log( workerData );
  var createWorkerRecord = function (createWorkerCallback) {
    dbWrapper( "create", workerData, createWorkerCallback);
  }

  var updateWorkerRecord = function ( data, updateWorkerCallback ) {
    dbWrapper( "update", data, updateWorkerCallback);
  }

  async.waterfall([createWorkerRecord, spawnAsync, updateWorkerRecord], function ( err, result) {
    if (err) {
      logging.err(JSON.stringify({create_record_spawn_async_error: {error: err}}))
    }
    else {
      console.log("Holy shit a worker completed!!!");
    }
  });
}

var requestValid = function ( request ) {
  /* You will add the actual validator below */
  var json = isJsonString(request);
  if (json) {
    return json;
  }
  else {
    return false;
  }
}

var endResponse = function (response, code) {
  if (response) {
    response.writeHead( code, { "content-type": "application/json" } );
    response.end();
    return true;
  }
  else {
    return false;
  }
};

/* Later there could be many different types of createWorker functions */
var createWorker = function ( rawReq, response ) {
//  This should wait for the db to respond before going on
  var validJson = requestValid(rawReq);
  if ( validJson ){
    endResponse(response, 200)
    var workerData = createWorkerData( validJson );
    createRecordSpawnAsync( workerData );
  }
  else {
    endResponse(response, 500)
    logging.err(JSON.stringify({param_error: {error: "The api was fed bad params.", raw_req: rawReq}}));
  }
};

module.exports = createWorker;
