var request = require("request")
request({ url: 'https://api.uber.com/v1/estimates/price',qs:{ end_longitude: -97.84403,end_latitude: 30.36463,start_longitude: -97.74403,start_latitude: 30.26463,server_token: 'cF68ys0b2s7wBN_hBCftOdTe6SlkQs6jqggth0Z7' }}, function (err, response, body) {
  console.log(body)
})
