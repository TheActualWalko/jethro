const socket = io.connect("http://sam-watkinson.com:3000");

const imgElement = document.getElementById("img");

const URL = window.URL || window.webkitURL;

const vote = ( dir )=>{
  console.log("voting " + dir);
  socket.emit("vote", dir, result=>{
    if( result === "voted" ){
      console.log("voted successfully");
    }else{
      console.log("vote failed: " + result);
    }
  });
};

const liveChatElement = document.getElementById("live-chat");

const entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

const escapeHtml = (string)=>{
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}

const addMessage = ( message, sender )=>{

  $(liveChatElement).prepend(`
    <div class="message">
      <strong>${escapeHtml(sender)}:</strong><br />${escapeHtml(message)}
    </div>
  `);
};

socket.on("connect", ()=>{
  console.log("connected");
});

socket.on("results", results=>{
  console.log(results);
});

let lastURL;

socket.on("frame", frame=>{
  const blob = new Blob([frame], { type : "image/jpg" });
  const blobURL = URL.createObjectURL(blob);
  imgElement.setAttribute("src", blobURL);
  if( lastURL ){
    URL.revokeObjectURL( lastURL );
  }
  lastURL = blobURL;
  console.log("got frame");
});

socket.on("message", ( message, sender )=>{
  addMessage( message, sender );
});

const buttons = document.querySelectorAll("button");

buttons.forEach( b=>{
  b.addEventListener("click", ()=>{
    vote( b.attributes["data-vote"].value );
  });
});