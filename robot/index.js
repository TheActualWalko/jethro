"use strict";

const MOVE_TIME = 0;

const tessel = require('tessel');
const infraredlib = require('ir-attx4');
const infrared = infraredlib.use(tessel.port.A);
const io = require("socket.io-client");
const av = require('tessel-av');
const camera = new av.Camera({
  fps : 5
});


const LegoIR = require('./lego-ir-copypaste');
const lego = new LegoIR({
  mode: 'comboDirect',
  channel: 1
});

const FREQUENCY_KHZ = 38;
const toBuffer = movement=>lego.move({ outputA : movement[0], outputB : movement[1] });
const TIMEOUTS = {
  FORWARD: 600,
  LEFT: 5,
  RIGHT: 5,
  BACKWARD: 600
};
const DIRECTIONS = {
            // left       right
  FORWARD:  [ 'forward', 'backward' ],
  BACKWARD: [ 'backward', 'forward' ],
  LEFT:     [ 'forward',  'forward' ],
  RIGHT:    [ 'backward', 'backward'],
};
const STOP_MOVE = [ 'brake', 'brake' ];

let isSending = false;
let isMoving = false;

const sendLegoSignal = (move, callback)=>{
  infrared.sendRawSignal(FREQUENCY_KHZ, toBuffer(move), (err)=>{
    if( err ){
      console.log(err);
    }
    if( callback ){
      setTimeout(callback, 5);
    }
  });
};

let nextMove;

const doneSending = ()=>{
  isSending = false;
  if( nextMove ){
    move( nextMove );
    nextMove = null;
  }
}

const move = (directionStr)=>{
  isMoving = true;
  const movement = DIRECTIONS[directionStr];
  sendLegoSignal(
    movement, 
    ()=>{
      setTimeout(()=>
        sendLegoSignal(
          STOP_MOVE,
          ()=>isMoving = false
        ),
        TIMEOUTS[directionStr]
      )
    }
  );
}

let socketToStreamTo;

const streamTo = socket=>{
  //const capture = camera.capture();
  //console.log("captured");
  socketToStreamTo = socket;
  camera.on("frame", frame=>{
    if( !isSending && !isMoving ){
      console.log("sending frame");
      isSending = true;
      socketToStreamTo.emit("frame", frame, (response)=>{
        if(response !== "got it"){
          console.log(response);
        }
        doneSending();
      });
    }
  });
};

infrared.on('ready', function(err) {
  if(err) throw new Error(err);
  console.log("connected to ir module");
  const socket = io.connect("http://sam-watkinson.com:3001");
  socket.on("connect", ()=>{
    console.log("connected to democracy server");
    streamTo(socket);
  });
  socket.on("move", (direction)=>{
    console.log("moving " + direction);
    if( isSending ){
      nextMove = direction;
    }else{
      move( direction );
    }
  });
});