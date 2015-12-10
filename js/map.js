var Map = function(width, height, seed) {
  this.width = width;
  this.height = height;
  this.seed = seed || .1

  this.data = [];
  this.blendSize = 16

  this.noise = new Noise();
  this.noise.seed(this.seed);

  // TODO: make these actual properties and move colors elsewhere
  // getImageData should cross referenc with own colors maped to levels
  this.heightProperties = {};
  this.heightProperties[155] = [0, 71, 165, 1];    // deeps
  this.heightProperties[161] = [0, 101, 165, 1];   // shwallows
  this.heightProperties[165] = [204, 177, 82, 1];  // sand
  this.heightProperties[190] = [86, 125, 38, 1];   // grass
  this.heightProperties[205] = [152, 152, 152, 1]; // mountain
  this.heightProperties[255] = [240, 240, 240, 1]; // snow

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

  writeImageData: function(image) {
    var image = image;

    var getColor = function(value) {
      for(var l in map.heightProperties) {
        if (Math.min(value, l) == value) {
          return map.heightProperties[l];
        }
      }
    }

    var writeRGBA = function(cell, color) {
      image.data[cell] = color[0];
      image.data[cell + 1] = color[1];
      image.data[cell + 2] = color[2];
      image.data[cell + 3] = 255; // alpha.
    }

    for (var x = 0; x < map.width; x++) {
      for (var y = 0; y < map.height; y++) {
        var cell = (x + y * map.width) * 4;
        var color = getColor(this.data[x][y]);
        writeRGBA(cell, color);
      }
    }

    return image;
  },


}
