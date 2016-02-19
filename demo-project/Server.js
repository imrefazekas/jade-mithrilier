let http = require('http')
let connect = require('connect')
let serveStatic = require('serve-static')

let app = connect()
	.use( serveStatic('./www') )


let server = http.createServer(app)

server.listen( 8080, function () {
	console.log( 'Running on http://localhost:8080' )
})
