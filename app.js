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
        // create record that request was recieved in mongo
        createWorker( data );
      });
      res.end();
});

/* grab uncompleted jobs and start their processes 
 * Find all jobs that are not done or expired, create workers for all those jobs
*/
server.listen( config.port );
