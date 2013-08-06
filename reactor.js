var Readable = require('stream').Readable || require('readable-stream/readable');
var Speaker = require('speaker');

var wave = new Readable();

module.exports = function (sampleRate, channels, bitDepth) {
  wave.sampleRate = sampleRate;
  wave.channels = channels;
  wave.bitDepth = bitDepth;

  wave.samplesGenerated = 0;
  wave.sampleSize = wave.bitDepth / 8;
  wave.blockAlign = wave.sampleSize * wave.channels;
  wave.players = [];
  wave.cues = {};
  wave.vu = new Array(wave.channels);
  wave.buffer = 44100*4 / 100;
  
  return wave;
}

wave.start = function (sampleRate, channels, bitDepth) {
  wave.pipe(new Speaker());
}

wave._read = function (n) { // n = 16384
  var numSamples = this.buffer / this.blockAlign | 0;
  var buf = new Buffer(numSamples * this.blockAlign);
  
  for (var i = 0; i < this.channels; i++)
    wave.vu[i] = 0;
  
  for (var i = 0; i < numSamples; i++) {
    //buf.writeInt16LE(Math.round((this.samples[this.offset].l + this.samples2[this.offset].l) / 2), i*sampleSize*2);
    //buf.writeInt16LE(Math.round((this.samples[this.offset].r + this.samples2[this.offset].r) / 2), i*sampleSize*2+2);
    
    var sampleIdx = i + this.samplesGenerated;
    if (sampleIdx in this.cues) {
      console.log('Cueing in sample');
      this.players.push(this.cues[sampleIdx]);
      delete this.cues[sampleIdx];
    }
    
    var sample = new Array(this.channels);
    for (var chan = 0; chan < this.channels; chan++) sample[chan] = 0;
    
    for (var j = 0; j < this.players.length; j++) {
      var point = this.players[j].next();
      if (!point) {
        console.log('Source ran dry');
        this.players.splice(j, 1);
        j--;
      } else {
        for (var chan = 0; chan < this.channels; chan++) {
          sample[chan] += (point[chan] * this.players[j].multiplier);
        }
      };
    }
    
    for (var channel = 0; channel < this.channels; channel++) {
      var offset = (i * this.blockAlign) + (channel * this.sampleSize);
      if (sample[channel] > 32767) sample[channel] = 32767;
      if (sample[channel] < -32768) sample[channel] = -32768;
      buf.writeInt16LE(Math.round(sample[channel]), offset);
      
      this.vu[channel] = Math.max(this.vu[channel], sample[channel]);
    }
  }
  
  this.push(buf);
  this.samplesGenerated += numSamples;
  //console.log(new Array(Math.round(this.vu[0]/150)).join('#'));
}

