var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static')

var app = connect()
	.use( serveStatic('./www') )
;

server = http.createServer(app);

server.listen( 8080, function() {
	console.log( 'Running on http://localhost:8080' );
});
