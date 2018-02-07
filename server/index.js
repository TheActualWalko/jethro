const VOTE_DURATION = 3000;

const SocketIO = require("socket.io");
const Democracy = require("./democracy");
const fs = require("fs");

let robotSocket;
let voteInterval;
let clientSockets = {};

const allowedCandidates = [
  "FORWARD", 
  "BACKWARD", 
  "LEFT", 
  "RIGHT"
];

const clientIO = SocketIO(3000);
console.log("listening on port 3000");

const robotIO = SocketIO(3001);
console.log("listening on port 3001");

clientIO.on("connect", socket=>{
  socket.on("disconnect", ()=>{
    console.log("disconnected client socket");
  });
  socket.on("vote", (candidate, callback = ()=>{})=>{
    if( allowedCandidates.indexOf(candidate) >= 0 ){
      Democracy.vote(socket.id, candidate);
      console.log("received vote for " + candidate);
      callback("voted");
    }else{
      callback("invalid");
    }
  });
  socket.on("message", (message)=>{
    const date = new Date().toLocaleTimeString("en-US", {
      year: "numeric", month: "short", day : "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    clientIO.sockets.emit("message", message, socket.id);
    fs.appendFileSync("/var/log/tweetplaysrc-chat.log", `[${date}] ${socket.id}:\n${message}\n\n`)
  });
  console.log("connected new client socket");
});

robotIO.on("connect", socket=>{
  socket.on("disconnect", ()=>{
    console.log("disconnected robot socket");
    robotSocket = null;
  });
  socket.on("frame", (frame, callback)=>{
    console.log("got frame");
    callback("got it");
    clientIO.sockets.emit("frame", frame);
  });
  console.log("connected new robot socket");
  robotSocket = socket;
  if( voteInterval ){
    clearInterval( voteInterval );
  }
  Democracy.complete();
  voteInterval = setInterval(()=>{
    const results = Democracy.complete();
    if( results.winner !== undefined ){
      clientIO.sockets.emit("results", results);
      robotSocket.emit("move", results.winner);
      console.log(results.winner + " wins");
    }
  }, VOTE_DURATION);
});