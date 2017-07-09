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
// This instance is unique for a server.
var io = socketIO.listen(app);

// This function will be fired for each client,
// Each socket in this scope has scope.id which is identical for each client.
io.sockets.on('connection', function(socket) {
  // Who need this function?
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    // socket.emit('log', array);
  }

  // SGN 2
  socket.on('ipaddr', function() {
    console.log('ipaddr');
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          console.log('Access from:' + details.address);
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  // SGN 6
  socket.on('create or join', function(room) {
    var numClients = io.sockets.sockets.length;
    if (numClients === 1) {
      socket.join(room);
      socket.emit('created', room, socket.id);
    } else {
      socket.join(room);
      socket.emit('joined', room, socket.id);
      // What is difference between two functions below?
      // https://socket.io/docs/emit-cheatsheet/
      // All client in the 'room'
      io.sockets.in(room).emit('ready', room);
      // All but the socket
      socket.broadcast.emit('ready', room);
    } 
  });

  // SGN 13
  socket.on('message', function(message) {
    // console.log('CLIENTS:' + io.sockets.sockets.length);
    socket.broadcast.emit('message', message);
  });

  socket.on('bye', function(){
    console.log('received bye');
  });

});
