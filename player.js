
var Player = module.exports = function (loader) {
  this.loader = loader;
  this.chunk = 0;
  this.sample = 0;
  this.multiplier = 0.7;
};

Player.prototype.next = function () {
  if (this.paused) return [0, 0];
  
  if (!this.samples) this.samples = this.loader.getChunk(0);
  
  if (this.sample >= this.samples.length) {
    this.samples = this.loader.getChunk(++this.chunk);
    if (!this.samples.length) return null;
    this.sample = 0;
  };
  
  return this.samples[this.sample++];
};

