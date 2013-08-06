
var Player = module.exports = function (loader) {
  this.loader = loader;
  this.chunk = 0;
  this.sample = 0;
  this.multiplier = 0.7;
  this.overall = 0;
  
  this.lofi = false;
  this.bitClock = 0;
  this.bitStore = [0,0];
  this.bitRate = 15;
};

Player.prototype.next = function () {
  if (this.paused) return [0, 0];
  
  if (!this.samples) this.samples = this.loader.getChunk(0);
  
  if (this.sample >= this.samples.length) {
    this.samples = this.loader.getChunk(++this.chunk);
    if (!this.samples.length) return null;
    this.sample = 0;
  };
  
  var sample = this.samples[this.sample++];
  
  if (this.lofi) {
    if (this.bitClock++ >= this.bitRate) {
      this.bitStore = sample;
      this.bitClock = 0;
    } else {
      sample = this.bitStore;
    };
  };
  
  /*
  if (this.last) {
    var val = 0.5 + (Math.sin(this.overall /22050) /2.1);
    
    sample[0] = (   val  * this.last[0]) + ((1-val) * sample[0]);
    sample[1] = ((1-val) * this.last[1]) + (   val  * sample[1]);
  };*/
  
  this.overall++;
  this.last = sample;
  return sample;
};

