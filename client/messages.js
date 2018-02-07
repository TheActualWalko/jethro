$("#message-input")
	.on("keypress", ( event )=>{
		if( event.key === "Enter" ){
			socket.emit("message", $("#message-input").val());
			$("#message-input").val("");
			event.preventDefault();
		}	
	});