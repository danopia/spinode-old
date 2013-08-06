
var Player = module.exports = function (loader) {
  this.loader = loader;
  this.chunk = 0;
  this.sample = 0;
  this.multiplier = 0.7;
  
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
  
  return sample;
};

