var Map = function(width, height, seed, tileWidth, tileHeight) {
  var self = this;
  this.width = width;
  this.height = height;
  this.seed = seed || .1
  this.tileWidth = tileWidth || 32;
  this.tileHeight = tileHeight || 32;

  this.data = [];
  this.tileData = [];
  this.blendSize = 16

  this.noise = new Noise();
  this.noise.seed(this.seed);

  var ocean = [
    'DDDDDDDD',
    'DEDDDDDD',
    'DDDDDDED',
    'DDDDDDDD',
    'DDDDDDDD',
    'DDDDDEDD',
    'DDDDDDDD',
    'DDDDDDDD',
  ];

  var shallows = [
    'EEEEEEEE',
    'EFEEEEEE',
    'EEEEEEFE',
    'EEEEEEEE',
    'EEEEEEEE',
    'EEEEEFEE',
    'EEEEEEEE',
    'EEEEEEEE',
  ];

  var beach = [
    '88888888F',
    '82888888F',
    '88888828F',
    '88888888F',
    '88888888F',
    '88888288F',
    '88888888F',
    '88888888F',
    'FFFFFFFFF',
  ];

  var grass = [
    'BBBBBBBB6.',
    'BABBBBBB6F',
    'BBBABBBB6F',
    'BBBBBBBB6F',
    'BBBBBABB6F',
    'BBBBBBBB6F',
    'BBABBBBB6F',
    'BBBBBBBB6F',
    '666666666F',
    'FFFFFFFFFF',
  ];

  var vegetation = [
  	'BBBAABBB6..',
  	'BBAAAABB663',
  	'BAAAAAAB663',
  	'BAAAAAAB663',
  	'BAAAAAAB663',
  	'BBA5AABB663',
  	'BBB55BBB663',
    'BBBBBBBB663',
    '66666666663',
    '66666666663',
    '33333333333',
   ];

  var alpine = [
    '111111116...',
  	'1111C1116333',
  	'111C1C116333',
  	'11C119C16333',
  	'1C1CC99C6333',
  	'C1C19C996333',
  	'1C1199C96333',
  	'C111999C6333',
    '666666666333',
    '333333333333',
    '333333333333',
    '333333333333',
  ];

  var snow = [
    '22222222',
    '2222F222',
    '22222222',
    '22222222',
    '22222222',
    '22222222',
    '2F222222',
    '22222222'
  ];

  var ocean = [
    '...DD...',
  	'..DDDD..',
  	'.DDDDDD.',
  	'DDDDDDDD',
  	'DDDDDDDD',
  	'.DDDDDD.',
  	'..DDDD..',
  	'...DD...'  ];

  var beach = [
    '...88...',
  	'..8888..',
  	'.888888.',
  	'88888888',
  	'88888888',
  	'F888888F',
  	'.F8888F.',
  	'..F88F..',
  	'...FF...',
    '........',
  ];

  var grass = [
    '...BB...',
  	'..BABB..',
  	'.BBBBBB.',
  	'BABBBBBB',
  	'BBBABBBB',
  	'6BBBBBB6',
  	'86BBBB68',
  	'F86BB68F',
  	'.F8668F.',
  	'..F88F..',
  	'...FF...',
    '........',
  ];

  var elevation = function(name, rgbaArr, paletteKey, texture, width, height, yOffset) {
      this.name = name;
      this.rgbaArr = rgbaArr;
      this.paletteKey = paletteKey;
      this.texture = texture;
      this.width = width || self.tileWidth;
      this.height = height || self.tileHeight;
      this.yOffset = yOffset || 0;
  }
  elevation.prototype.rgba = function() {
    return 'rgba(' + this.rgbaArr.join(',') + ')';
  }

  this.elevations = [];
  this.elevations[161] = new elevation('ocean', [0, 71, 165, 1], 'D', ocean);
  this.elevations[165] = new elevation('beach', [204, 177, 82, 1], '8', beach);
  this.elevations[255] = new elevation('grass', [86, 125, 38, 1], 'B', grass);
  /*
  this.elevations[161] = new elevation('shallows', [0, 101, 165, 1], 'E', shallows);
  this.elevations[170] = new elevation('grass', [86, 125, 38, 1], 'B', grass);
  this.elevations[190] = new elevation('trees', [86, 125, 38, 1], 'A', vegetation);
  this.elevations[205] = new elevation('alpine', [152, 152, 152, 1], '1', alpine);
  this.elevations[255] = new elevation('snow', [240, 240, 240, 1], '2', snow);
  */

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
        return this.elevations[l];
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
