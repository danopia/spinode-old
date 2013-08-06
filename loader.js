var Emitter = require('events').EventEmitter;
var util = require('util');

var lame = require('lame');
var mm = require('musicmetadata');

var Loader = module.exports = function () {
  Emitter.call(this);
  
  this.metaStream = new Emitter();
  this.metaParser = new mm(this.metaStream);
  this.metaParser.on('metadata', function (result) {
    this.emit('metadata', result);
  }.bind(this));
  
  this.chunkLen = 44100 * 5;
  this.chunks = [];
};
util.inherits(Loader, Emitter);

Loader.prototype.getChunk = function (idx) {
  var buff = this.chunks[idx];
  var samples = new Array(buff.length / 4);
  for (var i = 0; i < samples.length; i++) {
    samples[i] = {
      l: buff.readInt16LE(i * 4    ),
      r: buff.readInt16LE(i * 4 + 2)};
  }
  return samples;
};

Loader.prototype.loadMp3 = function (stream) {
  this.inStream = stream;
  this.decoder = new lame.Decoder();
  
  stream.on('data', function (chunk) {
    this.decoder.write(chunk);
    this.metaStream.emit('data', chunk);
  }.bind(this)).on('end', function () {
    this.decoder.end();
  }.bind(this));
  
  this.decoder.on('format', function (fmt) {
    this.emit('format', fmt);
  }.bind(this));
  
  var buff = new Buffer(0);
  this.decoder.on('data', function (chunk) {
    buff = Buffer.concat([buff, chunk]);
    
    while (buff.length >= this.chunkLen) {
      var slice = new Buffer(this.chunkLen);
      buff.copy(slice, 0, 0, this.chunkLen);
      buff = buff.slice(this.chunkLen);
      this.chunks.push(slice);
    };
    
  }.bind(this)).on('end', function () {
    if (buff.length)
      this.chunks.push(buff);
    
    console.log('done,', this.chunks.length, 'chunks');
    this.emit('loaded');
  }.bind(this));
};

Loader.prototype.loadMp3Old = function (stream) {
  this.inStream = stream;
  this.decoder = new lame.Decoder();
  
  stream.on('data', function (chunk) {
    this.decoder.write(chunk);
    this.metaStream.emit('data', chunk);
  }.bind(this)).on('end', function () {
    this.decoder.end();
  }.bind(this));
  
  this.decoder.on('format', function (fmt) {
    this.emit('format', fmt);
  }.bind(this));
  
  var buff = new Buffer(this.chunkLen * 2);
  var buffOff = 0;
  var buffLen = 0;
  this.decoder.on('data', function (chunk) {
    if (buffOff + buffLen + chunk.length > buff.length) {
      buff.copy(buff, 0, buffOff, buffLen + buffOff);
      buffOff = 0;
    };
    
    chunk.copy(buff, buffLen);
    buffLen += chunk.length;
    
    while (buffLen >= this.chunkLen) {
      var slice = new Buffer(this.chunkLen);
      buff.copy(slice, 0, buffOff, buffOff + this.chunkLen);
      buffOff += this.chunkLen;
      buffLen -= this.chunkLen;
      this.chunks.push(slice);
    };
    
  }.bind(this)).on('end', function () {
    if (buffLen)
      this.chunks.push(buff.slice(buffOff, buffLen + buffOff));
    
    console.log('done,', this.chunks.length, 'chunks');
    this.emit('loaded');
  }.bind(this));
};



/*var raw = new Buffer(80000000);
var off = 0;
decoder.on('data', function (chunk) {
  //raw = Buffer.concat([raw, chunk]);
  chunk.copy(raw, off);
  off += chunk.length;
});
decoder.on('end', function () {
  var samples = [];
  for (i = 0; i < (off / 4); i++ ) {
    samples[i] = raw.readInt16LE(i * 4);
  };
  console.log('got', samples.length, 'samples,', samples.length / 44100, 'seconds');
  
  var max = 0;
  for (var i = 0; i < samples.length; i++) {
    max = Math.max(max, samples[i]);
    //console.log(new Array(Math.round(samples[i]/1000+50)).join(' ') + '#');
  }
  console.log(max);
  
  /*
  var win = 512*10; // 5*4410;
  var bt = new BeatDet(win);
  for (var i = 0; i < samples.length; i += win) {
    var o = [];
    bt.do(samples.slice(i, i + win), o);
  console.log('bpm:', bt.get_bpm());
  console.log('confid:', bt.get_confidence());
    //console.log(o);
  }
  console.log('bpm:', bt.get_bpm());
  console.log('confid:', bt.get_confidence());
  *
});

var idx = 0
var s=setInterval(function () {
  output.write(raw.slice(idx * 44100, (idx+1) * 44100));
  if ((idx+1)*44100 >= off) { clearInterval(s); console.log('done'); }
  idx++;
  console.log((idx+1)*44100 / off)
}, 1000/4);

//decoder.on('data', function (raw) {
//  console.log(raw);
//});

/*
// create the Encoder instance
var encoder = new lame.Encoder({
  channels: 2,        // 2 channels (left and right)
  bitDepth: 16,       // 16-bit samples
  sampleRate: 44100   // 44,100 Hz sample rate
});

// raw PCM data from stdin gets piped into the encoder
process.stdin.pipe(encoder);

// the generated MP3 file gets piped to stdout
encoder.pipe(process.stdout);
*/
