var Emitter = require('events').EventEmitter;
var util = require('util');

var lame = require('lame');
var mm = require('musicmetadata');

var Loader = module.exports = function () {
  Emitter.call(this);
  
  this.metaStream = new Emitter();
  this.metaParser = new mm(this.metaStream);
  this.metaParser.on('metadata', function (result) {
    this.metadata = result;
    this.emit('metadata', result);
  }.bind(this));
  
  this.chunkLen = 44100 * 5;
  this.chunks = [];
};
util.inherits(Loader, Emitter);

Loader.prototype.getChunk = function (idx) {
  var buff = this.chunks[idx];
  if (!buff) return [];
  var samples = new Array(buff.length / 4);
  for (var i = 0; i < samples.length; i++) {
    samples[i] = [
      buff.readInt16LE(i * 4    ),
      buff.readInt16LE(i * 4 + 2)];
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
    this.format = fmt;
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
    
    console.log('done loading', this.chunks.length, 'chunks');
    this.loaded = true;
    this.emit('loaded');
  }.bind(this));
};

