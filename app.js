var http = require("http");
var createWorker = require("./workers");
var config = require("./config");
var fs = require("fs");

var server = http.createServer( function ( req, res ) {
  if ( req.method === 'GET' ) {
    res.writeHeader(200, { "Content-Type": "text/html" } );
    var html = fs.readFileSync('index.html');
    res.end(html);
  }
  else if ( req.method === 'POST') {

      data = '';

      req.on("data", function (chunk) {
        data += chunk;
      });

      req.on("end", function () {
        // create record that request was recieved in mongo
        createWorker( data, res );
      });
  }
  else {
    response.writeHead( 500, { "content-type": "application/json" } );
    response.end();
  }
});

/* grab uncompleted jobs and start their processes 
 * Find all jobs that are not done or expired, create workers for all those jobs
*/
server.listen( config.port );
