// npm install speaker musicmetadata lame

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  console.log('connected');
  socket.on('motion', function (data) {
    console.log(data.inclGrav);
    player1.bitRate = 15 + data.inclGrav.y;
  });
});




var fs = require('fs');
var Loader = require('./loader');
var Player = require('./player');
var Reactor = require('./reactor')(44100, 2, 16);

var loader1 = new Loader();
loader1.on('metadata', function (meta)   { console.log(meta);   });
loader1.on('format',   function (format) { console.log(format); });
loader1.loadMp3(fs.createReadStream('pizzarolls.mp3'));

var loader2 = new Loader();
loader2.on('metadata', function (meta)   { console.log(meta);   });
loader2.on('format',   function (format) { console.log(format); });
loader2.loadMp3(fs.createReadStream('getlucky.mp3'));

var player1 = new Player(loader1);
setTimeout(function () {
  Reactor.cues[Reactor.samplesGenerated] = player1;
}, 1000);
setTimeout(function () {
  //Reactor.cues[Reactor.samplesGenerated] = new Player(loader2);
}, 5000);

Reactor.start();

process.stdin.on('data', function (d) {
  console.log('ret');
  player1.lofi = !player1.lofi;
});

