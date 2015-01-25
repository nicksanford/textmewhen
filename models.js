var mongoose = require('mongoose');
var logging = require('node-logging');
var config = require("./config");
mongoose.connect(config.databaseUrl);
var db = mongoose.connection;
db.on('error', function () { console.log('connection error:') });
db.once('open', function (callback) {
  console.log("OPEN FOR BUSINESS")
});

var requestSchemaObj = {
  start_latitude: { type: Number, required: true },
  start_longitude: { type: Number, required: true },
  end_latitude: { type: Number, required: true },
  end_longitude: { type: Number, required: true },
  end_time: { type: Date, required: true },
  email: { type: String, match: /@/, lowercase: true, required: true },
  desired_price: { type: Number, required: true }
}

var uberRequestSchema = mongoose.Schema(requestSchemaObj);

var uberRequestJobSchema = mongoose.Schema({
  url: { type: String, required: true },
  parameters: {
    server_token: { type: String, required: true },
    start_latitude: requestSchemaObj.start_latitude,
    start_longitude: requestSchemaObj.start_longitude,
    end_latitude: requestSchemaObj.end_latitude,
    end_longitude: requestSchemaObj.end_longitude
    },
  state: {type: String, enum: ["started", "request_error", "success", "timeout", "uber_api_limit_error"], required: true },
  end_time: requestSchemaObj.end_time,
  email: requestSchemaObj.email,
  desired_price: requestSchemaObj.desired_price
});

var UberRequestJob = mongoose.model("uberRequestJob", uberRequestJobSchema);
var UberRequest = mongoose.model("uberRequest", uberRequestSchema);

module.exports = { UberRequestJob: UberRequestJob,  UberRequest: UberRequest} ;
