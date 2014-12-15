var logging = require('node-logging');
var http = require("http");
var createWorker = require("./workers");
var config = require("./config");

var server = http.createServer( function ( req, res ) {
      res.writeHead( 200, { "content-type": "application/json" } );

      data = '';

      req.on("data", function (chunk) {
        data += chunk;
      });

      req.on("end", function () {
        var reqData = JSON.parse(data);
        logging.inf(JSON.stringify({incoming_post_request: reqData }));
        createWorker(reqData);
      });
      res.end();
});

/* grab uncompleted jobs and start their processes */

server.listen( config.port );
