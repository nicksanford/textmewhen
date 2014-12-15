var config = require("./config");
var logging = require('node-logging');
var request = require("request");
var sendMessage = require("./message_interfaces");

var spawnAsync = function (apiObj) {
  request({url:apiObj.url, qs:apiObj.parameters}, function (err, response, body) {
    var uberResponseBody = body ? JSON.parse(body) : {};
    if (err) {
      logging.err(JSON.stringify({request_error: {error: err, api_obj: apiObj}}));
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
        sendMessage(apiObj.email, msg);

      }
      else if ( (Number( uberResponse.low_estimate ) > Number( apiObj.desired_price ) ) && jobStillHasTime(apiObj.end_time) ) {
        /* try again*/
        logging.inf( JSON.stringify( { call_worker_again: {api_obj: apiObj} }) );
        setTimeout( function () {
          spawnAsync( apiObj );
        }, config.secsBetweenAsyncSpawns );

      }
      else {
        /* out of time */
        var msg = ( "Time is up for your request. Current price is: " + uberResponse.low_estimate + " Price desired: " + apiObj.desired_price + "Time: " + Date.now() + "End time: " + apiObj.end_time + "\nHere is your link anyways: " + uberMapLink(apiObj.parameters)  );
        logging.inf( JSON.stringify({ out_of_time: {msg: msg, api_obj: apiObj}}) );
        sendMessage(apiObj.email, msg);
      }
    }
    else {
        var msg = ( "Our service is under heavy load. Like your mom heavy.  Sorry for the inconvenience. Please try again later." );
        logging.err(JSON.stringify({ load_error: {msg: msg, uber_response: uberResponseBody, api_obj: apiObj }}));
        sendMessage(apiObj.email, msg);
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

/* Later there could be many different types of createWorker functions */
var createWorker = function ( jsonReq ) {
  var workerData =  {
          url: "https://api.uber.com/v1/estimates/price",
          parameters: {
            server_token: config.uberServerToken,
            start_latitude: jsonReq.start_lat,
            start_longitude: jsonReq.start_lon,
            end_latitude: jsonReq.end_lat,
            end_longitude: jsonReq.end_lon
            },
          end_time: jsonReq.end_time,
          email: jsonReq.email,
          desired_price: jsonReq.desired_price
          };
  spawnAsync( workerData );
};
module.exports = createWorker;
