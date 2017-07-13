'use strict';
var os = require('os');
var nodeStatic = require('node-static');
var https = require('https');
var socketIO = require('socket.io');
var fs = require('fs');
var ssl_server_key = 'server_key.pem';
var ssl_server_crt = 'server_crt.pem';
var port = 8082;
var options = {
	key: fs.readFileSync(ssl_server_key),
  cert: fs.readFileSync(ssl_server_crt)
};
var fileServer = new(nodeStatic.Server)();
var app = https.createServer(options, function(req, res) {
  fileServer.serve(req, res);
}).listen(port);
console.log("Started at " + port)
var io = socketIO.listen(app);

io.sockets.on('connection', function(socket) {
  socket.on('join', function(room) {
    socket.join(room);
    socket.emit('joined', room, socket.id);
    if (io.sockets.sockets.length >= 2) {
      io.to(room).emit('buddy', room);
    }
  });

  socket.on('exchangeId', function(room) {
    socket.broadcast.emit('exchangeId', room, socket.id);
  });

  socket.on('message', function(message) {
    socket.broadcast.emit('message', message);
  });

  socket.on('bye', function(){
    // TODO: safely leave a room
    console.log('received bye');
  });

});
