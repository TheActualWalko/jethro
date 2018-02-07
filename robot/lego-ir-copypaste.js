var path = require('path');
var fs = require('fs');
var LegoIR = {};

const MODES = {
  comboDirect : {
    code: '0001',
    outputs: ['outputA', 'outputB'],
    moves: {
      float: '00',
      forward: '01', 
      backward: '10',
      brake: '11'
    }
  }
};

var LegoIR = function(opts){
  if(!opts || !opts.mode || !opts.channel) throw new Error('Missing required params, please refer to documentation.');
  
  this.config = {
    channels: {
      1: '00',
      2: '01',
      3: '10',
      4: '11'
    },
    bits: {
      ss: [0, 200, 252, 24],
      hb: [0, 200, 254, 12],
      lb: [0, 200, 255, 6]
    },
    opts
  };

  this._loadMode(opts.mode);
};

LegoIR.prototype._loadMode = function(mode){
  this.config.mode = MODES[ mode ];
};

LegoIR.prototype._validOutput = function(output){
  var outputs = this.config.mode.outputs;
  var isValid = outputs.indexOf(output) > -1;
  if(!isValid) throw new Error('Invalid output for current mode.');
  return;
};

LegoIR.prototype._validMove = function(move){
  var isValid = move in this.config.mode.moves;
  if(!isValid) throw new Error('Invalid move for current mode or input.');
  return;
};

LegoIR.prototype._xorNibbles = function(nibbles){
  var xor = '';
  for(var i=0; i<4; i++){
    xor += 1 ^ nibbles.nib1[i] ^ nibbles.nib2[i] ^ nibbles.nib3[i];
  }
  return xor;
};

LegoIR.prototype._buildNibbles = function(moveBinary){
  var channel = this.config.opts.channel;
  var mode = this.config.mode;

  var nibbles = {
    nib1: '00'+this.config.channels[channel],
    nib2: mode.code,
    nib3: moveBinary
  };

  nibbles.nib4 = this._xorNibbles(nibbles);
  return nibbles;
};

LegoIR.prototype._binaryToStream = function(binary){
  var bits = this.config.bits;
  var stream = bits.ss;

  for(var i=0; i<binary.length; i++){
    if(binary[i] == '1'){
      stream = stream.concat(bits.hb);
    } else {
      stream = stream.concat(bits.lb);
    }
  };

  return stream.concat(bits.ss);
};

LegoIR.prototype._nibblesToBuffer = function(n){
  var binary = n.nib1 + n.nib2 + n.nib3 + n.nib4;
  var stream = this._binaryToStream(binary);
  return new Buffer(stream);
};

LegoIR.prototype.move = function(move){
  if(!move) throw new Error('Missing outputs from move command');
  var mode = this.config.mode;
  var outputs = mode.outputs;

  for(var output in move) {
    this._validOutput(output);
    this._validMove(move[output]);
  };

  var moveBinary = '';

  for(var i=0; i<outputs.length; i++){
    var isMoveSet = outputs[i] in move;
    var action = move[outputs[i]];

    if(isMoveSet) {
      moveBinary += mode.moves[action];
    } else {
      moveBinary += '00';
    };
  };

  var nibbles = this._buildNibbles(moveBinary);
  var buffer = this._nibblesToBuffer(nibbles);
  console.log( nibbles, buffer );
  return buffer;
};

module.exports = LegoIR;