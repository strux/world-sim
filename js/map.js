var Map = function(width, height, seed, tileWidth, tileHeight) {
  var self = map = this;
  this.width = width;
  this.height = height;
  this.seed = seed || .1
  this.tileWidth = tileWidth || 32;
  this.tileHeight = tileHeight || 32;

  this.sealevel = 162;

  this.data = [];
  this.tileData = [];
  this.blendSize = 16

  this.noise = new Noise();
  this.noise.seed(this.seed);

  var elevation = function(index, width, height) {
      this.index = index;
      this.width = width || self.tileWidth;
      this.height = height || self.tileHeight;

  }
  elevation.prototype = {
    setYOffset: function(n) {
      var multiplier = (255 - map.sealevel) / 100,
          offset = (Math.max(n, map.sealevel) - map.sealevel) * multiplier;
      return offset * .04;
    },
  }

  var SpriteIndicies = {
    ocean:    0,
    shallows: 1,
    beach:    2,
    grass:    3,
    alpine:   4,
    snow:     5,
  }

  this.elevations = [];
  this.elevations[155] = new elevation(SpriteIndicies.ocean);
  this.elevations[map.sealevel] = new elevation(SpriteIndicies.shallows);
  this.elevations[166] = new elevation(SpriteIndicies.beach);
  this.elevations[180] = new elevation(SpriteIndicies.grass);
  this.elevations[190] = new elevation(SpriteIndicies.alpine);
  this.elevations[255] = new elevation(SpriteIndicies.snow);

  this.sumOctaveOptions = {
    iterations: 8,
    persistence: .5,
    scale: .008,
    low: 0,
    high: 255
  }

  this.generateMap();
}
Map.prototype = {
  generateMap: function() {
    this.generateNoise();
    this.blendEdges();
  },

  generateNoise: function() {
    for (var x = 0; x < this.width; x++) {
      this.data[x] = [];
      for (var y = 0; y < this.height; y++) {
        var value = this.sumOctave(x, y);
        this.data[x][y] = value;
      }
    }
  },

  sumOctave: function(x, y) {
    var o = this.sumOctaveOptions;
    return this.noise.simplex2SumOctave(
      o.iterations,
      x, y,
      o.persistence,
      o.scale,
      o.low, o.high);
  },

  blendEdges: function() {
    for (var x = 0; x < this.width; x++) {
      var multiplier = this.blendSize;
      for(var b=0; b<this.blendSize; b++) {
        var wrapped = this.sumOctave(x, this.height + b);
        this.data[x][b] = ((wrapped * multiplier) + (this.data[x][b] * b)) / this.blendSize;
        multiplier--;
      }
    }
    var multiplier = this.blendSize;
    for(var b=0; b<this.blendSize; b++) {
      for (var y = 0; y < this.height; y++) {
        var wrapped = this.sumOctave(this.width + b, y);
        this.data[b][y] = ((wrapped * multiplier) + (this.data[b][y] * b)) / this.blendSize;
      }
      multiplier--;
    }
  },

  getElevation: function(value) {
    for(var l in this.elevations) {
      if (Math.min(value, l) == value) {
        var e = JSON.parse(JSON.stringify(this.elevations[l]));
        e.yOffset = this.elevations[l].setYOffset(value);
        return e;
      }
    }
  },

  writeTileData: function() {
    for (var x = 0; x < this.width; x++) {
      this.tileData[x] = [];
      for (var y = 0; y < this.height; y++) {
        this.tileData[x][y] = this.getElevation(this.data[x][y]);
      }
    }
    return this.tileData;
  },

  writeImageData: function(image) {
    // image data from 2D canvas context
    var image = image;

    var writeRGBA = function(cell, color) {
      image.data[cell] = color[0];
      image.data[cell + 1] = color[1];
      image.data[cell + 2] = color[2];
      image.data[cell + 3] = 255; // alpha.
    }

    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        var cell = (x + y * this.width) * 4;
        var color = this.getElevation(this.data[x][y])['rgbaArr'];
        writeRGBA(cell, color);
      }
    }

    return image;
  },


}
