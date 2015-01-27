var mongoose = require('mongoose');
var logging = require('node-logging');
var config = require("./config");
mongoose.connect(config.databaseUrl);
var db = mongoose.connection;
db.on('error', function () { logging.err("MONGO CONNECTION ERROR"); });
db.once('open', function (callback) {
  logging.inf("MONGO CONNECTED");
});

var requestSchemaObj = {
  start_latitude:  { type: Number, required: true },
  start_longitude: { type: Number, required: true },
  end_latitude:    { type: Number, required: true },
  end_longitude:   { type: Number, required: true },
  email:           { type: String, match: /@/, lowercase: true, required: true },
  desired_price:   { type: Number, required: true }
};

var uberRequestSchema = mongoose.Schema(requestSchemaObj);

var uberRequestJobSchema = mongoose.Schema({
  url: { type: String, default: "https://api.uber.com/v1/estimates/price" },
  parameters: {
    server_token:     { type: String, default: config.uberServerToken },
    start_latitude:   requestSchemaObj.start_latitude,
    start_longitude:  requestSchemaObj.start_longitude,
    end_latitude:     requestSchemaObj.end_latitude,
    end_longitude:    requestSchemaObj.end_longitude
    },
  state:          { type: String, enum: ["started", "request_error", "success", "timeout", "uber_api_limit_error"], default: "started" },
  email:          requestSchemaObj.email,
  desired_price:  requestSchemaObj.desired_price,
  mail_state:     { type: String, enum: ["email_error", "email_sent" ] },
  low_estimate:   { type: Number },
  map_link:       { type: String },
  created_at:     { type: String, match: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
    default: function () { return ( new Date() ).toISOString() } },
  updated_at:     { type: String, match: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
    default: function () { return ( new Date() ).toISOString() } }
});

var UberRequestJob = mongoose.model("uberRequestJob", uberRequestJobSchema);
var UberRequest = mongoose.model("uberRequest", uberRequestSchema);

module.exports = { UberRequestJob: UberRequestJob,  UberRequest: UberRequest} ;
