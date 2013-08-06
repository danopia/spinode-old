var fs = require('fs');
var Readable = require('stream').Readable || require('readable-stream/readable');
var Speaker = require('speaker');
var Loader = require('./loader');

var loader = new Loader();
loader.on('metadata', function (meta)   { console.log(meta);   });
loader.on('format',   function (format) { console.log(format); });
loader.loadMp3(fs.createReadStream('pizzarolls.mp3'));

var loader2 = new Loader();
loader2.on('metadata', function (meta)   { console.log(meta);   });
loader2.on('format',   function (format) { console.log(format); });
loader2.loadMp3(fs.createReadStream('pizzarolls.mp3'));

loader2.on('loaded', function () {
  console.log('loader2 ready')
});

loader.on('loaded', function () {
  console.log('Starting playback');

  var stream = new Readable();
  stream.chunk = 0;
  stream.totalSent = 0;
  stream.loader = loader;
  stream.samples = loader.getChunk(0);
  stream.samples2 = loader2.getChunk(0);
  stream.offset = 0;
  stream._read = read;

  // create a SineWaveGenerator instance and pipe it to the speaker
  stream.pipe(new Speaker());

  // the Readable "_read()" callback function
  function read (n) {
    var sampleSize = 16 / 8;
    var blockAlign = sampleSize * 2;
    var numSamples = n / blockAlign | 0;
    var buf = new Buffer(numSamples * blockAlign);
    
    for (var i = 0; i < numSamples; i++) {
      if (this.offset >= this.samples.length) {
        this.samples = this.loader.getChunk(++this.chunk);
        this.samples2 = loader2.getChunk(this.chunk);
        this.offset = 0;
      }
      
      // fill with a simple sine wave at max amplitude
      buf.writeInt16LE(Math.round((this.samples[this.offset].l + this.samples2[this.offset].l) / 2), i*sampleSize*2);
      buf.writeInt16LE(Math.round((this.samples[this.offset].r + this.samples2[this.offset].r) / 2), i*sampleSize*2+2);
      this.offset++;
      /*for (var channel = 0; channel < this.channels; channel++) {
        var s = this.samplesGenerated + i;
        var val = Math.round(amplitude * Math.sin(t * s)); // sine wave
        var offset = (i * sampleSize * this.channels) + (channel * sampleSize);
        buf['writeInt' + this.bitDepth + 'LE'](val, offset);
      }*/
    }
    
    console.log(n, buf.length, this.chunk);
    this.push(buf);
    
    //this.offset += numSamples;

    if (this.chunk >= this.loader.chunks.length) {
      // after generating "duration" second of audio, emit "end"
      process.nextTick(this.emit.bind(this, 'end'));
    }
  }
});
