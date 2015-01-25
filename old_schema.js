var assert = require("assert");
var myEnv = require('schema')('envIdentifier', {})

var longitude_format = {
      type: "number",
      minimum: -180,
      maximum: 180,
      required: true
}
var latitude_format = {
      type: "number",
      minimum: -90,
      maximum: 90,
      required: true
}
var schema = myEnv.Schema.create({
  type: "object",
  properties: {
    start_lat: latitude_format,
    start_lon: longitude_format,
    end_lat: latitude_format,
    end_lon: longitude_format,
    end_time: {
      format: "date-time",
      type: "string",
      required: true

    },
    email: {
      type: "string",
      format: "email",
      required: true
    },
    desired_price: {
      type: "number",
      min: 0,
      required: true
    }
  }
});


module.exports = schema;
