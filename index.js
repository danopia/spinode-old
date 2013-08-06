// npm install speaker musicmetadata lame

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

var player1 = new Player(loader2);
setTimeout(function () {
  Reactor.cues[Reactor.samplesGenerated] = player1;
}, 1000);
setTimeout(function () {
  //Reactor.cues[Reactor.samplesGenerated] = new Player(loader2);
}, 5000);

Reactor.start();

process.stdin.on('data', function (d) {
  console.log('ret');
  player1.paused = !player1.paused;
});

