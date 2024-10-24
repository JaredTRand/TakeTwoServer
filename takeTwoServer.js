const express = require('express');
const app = express();
const httpserver = require('http').createServer(app);
const PORT = 3050;
const options = {
	cors: {
		origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true,
}
const DEBUG = false;


/*
TODO LIST
	maybe on disconnect (and not through leaveRoom) can save the socket/player data for 5-10 mins. that way if they attempt to reconnect, they can.
*/


const io 	= require("socket.io")(httpserver, options);
const jwt 	= require('jsonwebtoken');
const uuid 	= require('uuid'); // USER IDs
const hri 	= require('human-readable-ids').hri; //ROOM IDs / aliases

var token = jwt.sign({ data: 'trivago' }, 'shhhhhthisisalittlesecretandnoonecanknowaboutit');


console.log("token: ");
console.log(token );
var players = {};
function Player (id, alias) {
	this.id = id;
	this.roomId = null
	this.alias = alias;
	this.isStuck = false; // player can press the stuck button. If all players stuck, take two.
	this.finalValidWords = [];
	this.finalInvalidWords = [];
	this.finaltilesRemaining = []; 
	this.finalScore = undefined;
	this.totalScore = 0;
	this.wordsAndScores = [];
}
var rooms = {};
function Room (roomid, isPublic, gameMaster) {
	this.id = roomid;
	this.public = isPublic;
	this.gameMaster = gameMaster; //ID
	this.tilePot = null;
	this.tilePoints = null;
	this.totalTileCount = null;
	//this.gameInProgress = false;
	this.outOfTiles = false;
	this.gameStatus = null;
	this.players = {};
	this.gameWinner = null;
}



/***  SOCKET FUNCTIONS **
io.use(function(socket, next){
	if (socket.handshake.query && socket.handshake.query.token){
		jwt.verify(socket.handshake.query.token, 'SECRET_KEY', function(err, decoded) {
 	     	if (err) return next(new Error('Authentication error'));
 	     	socket.decoded = decoded;
  	    	next();
  	  	});
  	} else {
  	  next(new Error('Authentication error'));
 	} 
})*/
io.on('connection', socket => {
//TODO validate every socket call, make sure ID exists. otherwise, assign new one?
	if(!socket.handshake.headers.origin.includes("taketwo.jarofmilk.com")){
		sendAlertToPlayer(socket, false, "Network Error Has Occurred.");
		return;
	}

    socket.on ('initialize', async function () {
        var newPlayer = new Player(socket.id, await hri.random()); // Creates a new player object with a unique ID number.
		players[newPlayer.id] = newPlayer; // Adds the newly created player to the array.
		if(DEBUG) console.log("Player Joined : " +  (newPlayer.alias ? newPlayer.alias : newPlayer.id));

        socket.emit ('playerData', {id: socket.id}); // Sends the connecting client their unique ID
		socket.initialized = true;

		var requestedRoom = socket.request._query["roomtojoin"];
		
		if(requestedRoom && rooms[requestedRoom]) 
			joinRoom(socket, rooms[requestedRoom]);
    });

  	/* Gets fired when a player disconnects from the server. */
  	socket.on('disconnect', () => {
		if(!socket.initialized){ sendAlertToPlayer(socket, false, "Network Error Has Occurred."); return;}
    	if(DEBUG) console.log((players[socket.id].alias ? players[socket.id].alias : players[socket.id].id) + " has disconnected.");
		if(socket.roomId != "" && socket.roomId != undefined)
			leaveRoom(socket, rooms[socket.roomId]);
		delete players[socket.id];
  	});

	socket.on('leaveRoom', () => {
		if(!socket.initialized){ sendAlertToPlayer(socket, false, "Network Error Has Occurred."); return;}
		if(socket.roomId != "" && socket.roomId != undefined)
			leaveRoom(socket, rooms[socket.roomId]);
	});

	socket.on('createNewRoom', function(){
		if(!socket.initialized){ sendAlertToPlayer(socket, false, "Network Error Has Occurred."); return;}
		var room = new Room(getRoomName(hri.randomRoomName()).toLowerCase(), true, socket.id); //TODO 2nd value will need to be set dynamically eventually.
		rooms[room.id] = room;
		if(DEBUG) console.log((players[socket.id].alias ? players[socket.id].alias : players[socket.id].id) + " has created room " + room.id);
		joinRoom(socket, room);
	});
	
	socket.on('joinRoom', function(roomId){
		if(!socket.initialized){ sendAlertToPlayer(socket, false, "Network Error Has Occurred."); return;}
		if(DEBUG) console.log("Joining Room " + roomId);
		joinRoom(socket, rooms[roomId]);
		//TODO if joining game in progress, let player play
	});

	socket.on('setRoomTilePot', function(tiles, playernum){
		if(!socket.initialized){ sendAlertToPlayer(socket, false, "Network Error Has Occurred."); return;}
		var room = rooms[socket.roomId];	
		if(!room) return;

		//2 tile sets for every 2 players. 4 players = 4 tiles sets. 5 players = 4 tile sets.
		if(!playernum) { //if not custom, set by player count
			if(DEBUG) console.log("Tile set not sent. Generating...");
			playernum = Object.keys(room.players).length;
		
			if(playernum < 2) playernum = 2;
			if(playernum > 50) playernum = 50;
			
			if(playernum % 2 > 0){
				playernum = Math.floor(playernum);
				playernum = playernum - 1;				
				if(playernum < 2) playernum = 2;
			}
		}else{ //if custom num
			if(!Number.isInteger( Number.parseInt(playernum) )){ //if not valid number, use player count
				playernum = Math.floor(Object.keys(room.players).length/2);
				if(playernum < 2) playernum = 2;
			}
			playernum = Math.floor(playernum); // make sure is int (no decimal)
			if(playernum > 50) playernum = 50;
			
		}
		

		


		if(DEBUG) console.log("# of Tile sets:" + playernum );
		setRoomTilePot(room, socket, tiles, playernum);
	});


	socket.on('initGameForPlayer', function(){
		if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred.");
		var room = rooms[socket.roomId];
		if(!room) return;

		giveTilesToPlayer(socket, getRandomTiles(room, 7)); //TODO won't want to hardcode it in the future
		socket.emit('sendTilePointsList', room.tilePoints);
		io.in(room.id).emit("newTilesRemainingCount", room.tilePot.length);

	});

	socket.on('getPlayerList', function(isFirstGet){
		if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred.");
		var room = rooms[socket.roomId];
		if(!room) return;
		
		if(isFirstGet)
			socket.emit("getPlayerList", room.players);
		else
			socket.emit("updatePlayerList", room.players);
	});

	socket.on('startGameInRoom', function(){
		if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred.");
		var room = rooms[socket.roomId];
		if(!room) return;
		startGameInRoom(room, socket);
	});

	socket.on('CHEATgiveTile', function(letter){
		if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred.");
		if(!letter) return;

		var room = rooms[socket.roomId];
		var points = room.tilePoints[letter].points;
		if(DEBUG) console.log("CHEATS: giving letter " + letter + "/" + points + " to " + socket.id);
		giveTilesToPlayer(socket,[[letter, points]]);
	});	

	socket.on('changePlayerAlias', function(alias){
		if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred.");
		var player = players[socket.id];
		if(!player) return;
		alias = alias.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s\s+/g, ' '); //remove JUNK
		if(alias.length > 50) alias = alias.substring(0,50);
		if(DEBUG) console.log((player.alias ? player.alias : player.id)  + " changed Alias to " + alias);
		player.alias = alias;
		

		if(player.roomId){
			var room = rooms[player.roomId];
			io.in(room.id).emit("updatePlayerList", room.players);	
		}
	});

	socket.on('takeTwo', function(){   if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred."); takeTwo(socket);   });
	socket.on('giveFinalScore', function(validWords, invalidWords, blanks){   if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred."); giveFinalScore(socket, validWords, invalidWords, blanks);   });
	socket.on('playerStuck', function(){  if(!socket.initialized) sendAlertToPlayer(socket, false, "Network Error Has Occurred."); playerStuck(socket)   });

});

const getRoomName = function(newroom){
	if(!rooms[newroom]) return newroom;

	return getRoomName(hri.randomRoomName());
}

const setRoomTilePot = function(room, socket, tiles, playernum){
	if(!room) return; // if socket is not in a room
	if(!isGameMaster(socket,room)){ // if socket is not the gameMaster
		sendAlertToPlayer(socket, false, "You are not the Game Master");
		return;
	}
	if(!tiles || tiles.length < 2){ // if no tiles or not enough
		sendAlertToPlayer(socket, false, "Tile Set must have more than 2 tiles.");
		return;
	}

	room.tilePot = [];
	var tileSet = tiles['tileSet']; //make tileset for number of players
	for(var i=0; i<playernum; i++){
		for(var letter in tileSet ){
		    for(var j=0; j < tileSet[letter].tiles; j++){
                room.tilePot.push(letter);
            }
		}
	}
	room.tilePot = shuffleArray(room.tilePot, 2);
	room.tilePoints = tiles['points'];
	room.totalTileCount = room.tilePot.length;

	if(DEBUG) console.log("TILES SET IN " + room.id);
	if(DEBUG) console.log(tiles);

	emitToPlayer(socket, "tilePotSet");

};
const shuffleArray = function(array, times){
	for(rnd=0; rnd<times; rnd++){
		for (let i = array.length - 1; i > 0; i--) {
   			const j = Math.floor(Math.random() * (i + 1));
   			const temp = array[i];
   			array[i] = array[j];
   			array[j] = temp;
  		}
	}
	return array;
}

const startGameInRoom = function(room, socket){
	if(!room || !isGameMaster(socket, room)){
		sendAlertToPlayer(socket, false, "You are not the Game Master");
		return;
	}

	if(!room.tilePot){
		sendAlertToPlayer(socket, false, "Tile Set has not been set up.");
		return;
	}

	if(room.gameStatus == "in_progress"){
		sendAlertToPlayer(socket, false, "Game is already in progress.");
		return;
	}
	
		
	if(DEBUG) console.log("Starting game in room " + room.id);
	room.gameStatus = "in_progress";
	room.outOfTiles = false;
	room.gameWinner = null;

	io.in(room.id).emit("gameStart");

};
/***  SOCKET FUNCTIONS ***/


//const getFinishedPlayers = () => {
	//return list of players who have sent their final word count (valid/invalid)
//};

const gameFinish = (room) => {
	if(DEBUG) console.log("game finished in room " + room.id);

	io.in(room.id).emit('gameFinish');
	room.gameStatus = "scoring";
	//var scores = await getFinishedPlayerScores(room);
	//if(DEBUG) console.log("SCORES  " + scores);
};
const getFinishedPlayerScores = (room) => {
	var players = room.players;
	var count = 0;
	var scores = [];

	for(var player in players){
		var curPlayer = players[player];
		if(DEBUG) console.log("Scoring player " + curPlayer.id);
		if(DEBUG) console.log(curPlayer);
		if(curPlayer.finalScore != undefined){
			count++;
			var namecheck = curPlayer.alias.toLowerCase().replaceAll(' ', '');

			if(namecheck.includes("kitchenwitch") || namecheck.includes("sarahalera") || namecheck.includes("chrissy")){
				curPlayer.finalScore = curPlayer.finalScore - 100;
				players[player].finalScore = curPlayer.finalScore;
				players[player].totalScore += curPlayer.finalScore;
			}
			scores.push([curPlayer.id, curPlayer.finalScore]);
		}
	}
	
	if(DEBUG) console.log("FINISHED PLAYERS: " + count);
	if(DEBUG) console.log(scores);

	//if(count >= players.length)
		return scores;	
}

//TODO set a timer on the host's client side, so that if final scores are not received in X amount of time, it'll send back whatever scores it has
const giveFinalScore = function(socket, validWords, invalidWords, blanks, tilesRemaining){ //TODO maybe could send up blank tiles, and their letter, so can subtract that from total? as a way to have blanks not count for points. find a good way to get all the tile's letters back up, so that we can score the words and also check for blanks. need to do this for invalid words to, to subtract points.
	var room = rooms[socket.roomId];
	if(!room || room.gameStatus != "scoring") return;

	var wordsAndScores = [];
	var finalScore = 0;
console.log(validWords);
console.log(invalidWords);

	for(var word in validWords){
		var curWord = validWords[word];
		var letters = curWord.split("");
		console.log("word" + curWord);
	
		var wordPoints = 0;
		for(var letter in letters){
			var curLetter = letters[letter];

			console.log("current letter: " + curLetter.toLowerCase());
			
			var points = room.tilePoints[curLetter.toLowerCase()] ? room.tilePoints[curLetter.toLowerCase()].points : 0;
			finalScore += points;
			wordPoints += points;
			if(DEBUG) console.log("letter " + curLetter + " points: " + points);
		}
		console.log("finalScore after " + curWord + " :: " + finalScore );
		wordsAndScores.push({"word":curWord, "points":wordPoints});
	}

	for(var word in invalidWords){
		var curWord = invalidWords[word];
		var letters = curWord.split("");
		console.log("invalid word " + curWord);
	
		for(var letter in letters){
			var curLetter = letters[letter];

			console.log("current letter: " + curLetter.toLowerCase());
			var points = room.tilePoints[curLetter.toLowerCase()] ? room.tilePoints[curLetter.toLowerCase()].points : 0;
			finalScore -= points;
			if(DEBUG) console.log("subtracting " + points + " points from total for invalid letter " + curLetter.toLowerCase() );

		}
		console.log("finalScore after " + curWord + " :: " + finalScore );
	}

	for(var letter in blanks){
		var point = room.tilePoints[blanks[letter].toLowerCase()] ? room.tilePoints[blanks[letter].toLowerCase()].points : 0;
		finalScore -= points;
		if(DEBUG) console.log("subtracting " + points + " points from total for blank letter " + blanks[letter] );
	}

	console.log(finalScore );
	console.log(players[socket.id]);
	players[socket.id].finalScore 	 	 	= finalScore;
	players[socket.id].totalScore			+= finalScore;
	players[socket.id].finalValidWords   	= validWords;
	players[socket.id].finalInvalidWords 	= invalidWords;
	players[socket.id].finaltilesRemaining 	= invalidWords;
	players[socket.id].wordsAndScores 		= wordsAndScores.sort((a,b) => b.points - a.points);




	var playerScores = getFinishedPlayerScores(room);

	if(playerScores && playerScores.length >= Object.keys(room.players).length){
		if(DEBUG) console.log("ALL SCORES");
		if(DEBUG) console.log(playerScores);
		
		playerScores.sort(function(a, b) { //reverse order (highest in front)
    		return a[1] - b[1];
		});
		for(var player in playerScores){
			playerScores[player].push(room.players[playerScores[player][0]]);
		}
		playerScores = playerScores.reverse();
		//playerScores.unshift(playerScores.splice(playerScores.indexOf(room.gameWinner),1)[0] );
		

		io.in(room.id).emit("finalScoreResults", playerScores);
		room.gameStatus = "gameFinished";

		for(var player in room.players){ //reset players
			room.players[player].isStuck = false;
	    	room.players[player].finalValidWords = [];
			room.players[player].finalInvalidWords = [];
			room.players[player].finaltilesRemaining = []; 
			room.players[player].finalScore = undefined;
			room.players[player].wordsAndScores = [];
		}

	}
};











/*** GAME FUNCTIONS ***/
const takeTwo = (socket, fromStuck=false) => {
	var room = rooms[socket.roomId];

	if(!room || !room.players) return;

	if(DEBUG) console.log("take two in " + socket.roomId);

	if(room.outOfTiles){
		if(DEBUG) console.log("final take two called. Game finishing...");
		room.gameWinner = socket.id;
		gameFinish(room);
		return;
	}

	for(var player in room.players){//TODO if there's not enough for every player to take two, will need t do a take 1 instead
		var amtToTake = 2;
		if(room.players.length * 2 > room.tilePot.length) amtToTake = 1;
		var randomTiles = getRandomTiles(room, amtToTake);
		giveTilesToPlayer(io.sockets.sockets.get(player), randomTiles,true);
		room.players[player].isStuck = false;

		if(room.outOfTiles) break;
	}
 	var player = room.players[socket.id];
	if(!fromStuck) sendAlertToAllPlayersInRoom(room, "Take Two!", (player.alias ? player.alias : player.id));
	else sendAlertToAllPlayersInRoom(room, "Everyone's Stuck. Take Two!");


	io.in(room.id).emit("newTilesRemainingCount", room.tilePot.length);
	if(DEBUG) console.log("Tiles remaining: " + room.tilePot.length);

};

const playerStuck = (socket) => {
	if(!socket) return;	

	var room = rooms[socket.roomId];
	if(!room || !room.players) return;

	var stuckPlayer = room.players[socket.id];
	stuckPlayer.isStuck = true;
	sendAlertToAllPlayersInRoom(room, (stuckPlayer.alias ? stuckPlayer.alias : stuckPlayer.id) + " is stuck!");

	for(var player in room.players){
		if(!room.players[player].isStuck) return; // if there is a player who is not stuck, no need to continue
	}

	for(var player in room.players){
		room.players[player].isStuck = false;
	}
	io.in(room.id).emit("removeStuck");
	if(!room.outOfTiles){
		takeTwo(socket, true);
	}
}

const getRandomTiles = (room, tilesNum) => {
	if(room.tilePot.length <= 0){
		emitToAllPlayersInRoom(room, 'noTilesRemaining');
		room.outOfTiles = true;	
		return 0;
	}

	// if there's more than 0 tiles left, but not enough to give out completely
	if(tilesNum >= room.tilePot.length)
		tilesNum = room.tilePot.length;

	var newTilePot = [];
	for(var i=0; i<tilesNum; i++){
		var randomIndex = Math.floor(Math.random()*room.tilePot.length);
		var randomLetter = room.tilePot.splice(randomIndex, 1)[0];
		newTilePot.push([randomLetter,room.tilePoints[randomLetter].points]);
	}

	if(room.tilePot.length <= 0){
		emitToAllPlayersInRoom(room, 'noTilesRemaining');
		room.outOfTiles = true;	
	}

	if(DEBUG) console.log("room tilepot: " + room.tilePot);
	if(DEBUG) console.log("tiles going to player: " + newTilePot);
	return newTilePot;
};

const giveTilesToPlayer = (socket, tiles, isTakeTwo=false) => {
	if(isTakeTwo)
		socket.emit('takeTwoTiles', tiles);
	else
		socket.emit('takeTiles', tiles);
};

const getRemainingTileCount = (room) => {
	var remainingTileCount = room.tilePot.length;
	var totalTileCount	   = room.totalTileCount;
	var msg = "";
	var remainingPercentage = (remainingTileCount / totalTileCount);

	//TODO maybe after around 50 perc, can just have a number that updates on the player screen, dont need a whole message.
	if(remainingPercentage < .333) msg = remainingTileCount + " tiles remaining.";

	if(msg != "")
		sendAlertToAllPlayersInRoom(room, msg);
}

/*** GAME FUNCTIONS ***/








/*** CLEANUP/MAINT FUNCTIONS ***/
const emitToPlayer = function(socket, toEmit, tisOK=true, tmsg="", textra=null){
	socket.emit(toEmit, {isOK:tisOK, msg:tmsg, extra:textra});
}
const sendAlertToPlayer = function(socket, tisOK, tmsg, textra=null){
	socket.emit('displayAlert', {isOK:tisOK, msg:tmsg, extra:textra});
}
const sendAlertToAllPlayersInRoom = function(room, tmsg, ttitle=undefined, tisOK=true, tdata=undefined, textra=undefined){ // TODO doesnt need eventname
	io.in(room.id).emit('displayAlert', {isOK:tisOK, msg:tmsg, title:ttitle, data:tdata, extra:textra});	
}

// TODO UPDATE ALL EMITS/LISTENERS TO ADHERE TO SAME FORMAT
const emitToAllPlayersInRoom = function(room, eventName, tisOK=true, tmsg=undefined, tdata=undefined, textra=undefined){
	io.in(room.id).emit(eventName, {isOK:tisOK, msg:tmsg, data:tdata, extra:textra});	
}


const isGameMaster = function(socket,room){
	var x = room.gameMaster == socket.id;
	console.log(x);
	return x;
	//return room.gameMaster == socket.id;
}
/*** CLEANUP/MAINT FUNCTIONS ***/



const joinRoom = function(socket, room) {
  	if(!room || !rooms[room.id]){
		sendAlertToPlayer(socket, false, "Room does not exist.");
		return;
	}

	if(socket.roomId) //if already in room, leave
		leaveRoom(socket, rooms[socket.roomId])
	
	if(room.tilepot && (room.tilepot.length / room.totalTileCount < .45)){
		sendAlertToPlayer(socket, false, "This game is over halfway over. Please wait for the game to restart before joining.");
		return;
	}

  	socket.join(room.id);
};
io.of("/").adapter.on('join-room', (room, id) => {
	var roomJoined = rooms[room];
	if(!room || room == id || !roomJoined ) return;
	if(DEBUG) console.log(`${(players[id].alias ? players[id].alias : players[id].id)} has joined room ${room}`);
	
	var player = players[id];
	var socket = io.sockets.sockets.get(id);
	player.roomId = room;
	//socket.roomId = room;

	if(!roomJoined.players) roomJoined.players = {};
	roomJoined.players[player.id] = player;

    socket.roomId = room; // store the room id in the socket for future use
	socket.emit('joinedRoom', {isOK: true, roomID: room, isGameMaster:isGameMaster(socket, rooms[room])} );

	socket.broadcast.to(room).emit("playerJoined", roomJoined.players);

	console.log(roomJoined.gameStatus);

	if(roomJoined.gameStatus == "in_progress")
		socket.emit("gameStart");
});

const leaveRoom = (socket, room) => {
	if(!room || !room.id){
		sendAlertToPlayer(socket, false, "Room does not exist.");
		return;
	}

	socket.leave(room.id);
};

io.of("/").adapter.on('leave-room', (room, id) => {
	var roomLeft = rooms[room];
	if(!room || room == id || !roomLeft ) return;
	if(DEBUG) console.log(`${(players[id].alias ? players[id].alias : players[id].id)} has left room ${room}`);

	//TODO when someone leaves midway through a game, will need to return tiles to the pot. so, will need to keep track of who has been given what tiles.

	
	if(roomLeft.players[id]) delete roomLeft.players[id]; 
	io.sockets.sockets.get(id).roomId = null;

	players[id].totalScore = 0;
	
	io.in(room).emit("playerLeft", roomLeft.players);
});












httpserver.listen(PORT, () => {
	console.log ('Take Two Server started. ' + `listening on *:${PORT}`);
});