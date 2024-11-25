var Network = pc.createScript('network');
Network.attributes.add("tiletemplate", {type: "asset", assetType: 'template', title: "Tile Template", 
    description: ""});
// initialize code called once per entity
Network.prototype.initialize = function() {
    if(!window.socket)
        this.connectToServer(1);

    this.initToast();
};

// update code called every frame
Network.prototype.update = function(dt) {
    
};



/* TODO
add in sound effects / music. nothign obnoxious, just a little noise for picking up, placing
music is toggleable obviously. main music plays for most of the game, then when it gets to like 20% of tiles remaining will change to a faster and more stressful song. then when theres 0 tiles remaining, will play another stressful song. then when finished, will play that little whistle noise from nintendo games.
*/

Network.prototype.connectToServer = async function(attempts = 5){
    var parms = parseURLParams(window.location.href);
    var room = "";
    if(parms && parms.room){
        room = parms.room;
        if(room[0]) room = room[0];
    }
    
    window.socket = io.connect('https://jarofmilk.com', {
        path: "/taketwoapi/socket.io/",
        query: `roomtojoin=${room}`
    });
    window.socket.emit ('initialize');

    var self = this;

    window.socket.on ('reinitialize',   function (data) { window.socket.emit('initialize'); });
    window.socket.on ('playerData',     function (data) { self.initializePlayer(data); });
    window.socket.on('joinedRoom',      function(data){ self.joinedRoom(data); });
    window.socket.on('displayAlert',    function(data){ self.displayAlert(data); });
    window.socket.on('gameStart',       function(){ loadScene("Main", { hierarchy: true, settings: true }); });
    window.socket.on('playerJoined',    function(data){ self.updatePlayerList(data); });
    window.socket.on('playerLeft',      function(data){ self.updatePlayerList(data);    });
    window.socket.on('getPlayerList',   function(data){ self.updatePlayerList(data, false); });
    window.socket.on('updatePlayerList', function(data){ self.updatePlayerList(data); });
    window.socket.on('takeTiles',       function(data){ self.giveTiles(data); });
    window.socket.on('takeTwoTiles',    function(data){ self.giveTiles(data); });
    window.socket.on('sendTilePointsList', function(data){ window.tilesPointsList = data; });
    window.socket.on('tilePotSet',      function(data){ window.socket.emit('startGameInRoom'); });
    window.socket.on('gameFinish',      function(data){ self.gameFinish(data); });
    window.socket.on('newTilesRemainingCount', function(data){ $("#tiles-left-count").html(data); });
    window.socket.on('removeStuck',     function(data){   window.isStuck = false;   });
    window.socket.on('sendRoomList',     function(data){   pc.app.fire('BrowseRooms_datareturned', data)   });

    window.socket.on('noTilesRemaining', function(data){
        self.displayAlert({isOK:true, msg:"No Tiles Remaining"});
        $("#tiles-left-count").html("0");
    });

    window.socket.on('finalScoreResults', function(data){
        self.showFinalScores(data);

        window.gameFinished = true;
        document.body.style.cursor = 'default';
    });





}

Network.prototype.sleep = function(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

Network.prototype.initializePlayer = function (data) {
    window.playerID = data.id;
    // this.app.root.findByName("UUID").element.text = "UUID: " + window.playerID;
    this.initialized = true;
};

Network.prototype.joinedRoom = function(data){
    if(!data.isOK){
        // console.log(data.message);
        return;
    }
    if(data.roomID == undefined){
        this.displayAlert({isOK:true, msg:"Room not created. Please refresh the page"});
    }
    
    staticBackdrop.show();
    
    window.roomID = data.roomID.trim();

    window.isGameMaster = data.isGameMaster;

    if(!window.isGameMaster){
        $(".hide-if-not-gamemaster").each(function(){
            $(this).addClass("fade");
            $(this).prop( "disabled", true );
        });
    }else{
        $(".hide-if-not-gamemaster").each(function(){
            $(this).addClass("show");
            $(this).prop( "disabled", false );
        });
    }
    
    // this.app.root.findByName("RoomID").element.text = "Room ID: " + window.roomID;
    document.getElementById("staticBackdropLabel").innerHTML = window.roomID;

    window.socket.emit("getPlayerList", true);
};

Network.prototype.displayAlert = function(data){
    if(typeof data === 'string' || data instanceof String)
        window.createToast(data);
    else
        window.createToast(data.msg, 5000, data.isOK ? "#9ef89e" : "#ff0f0f", data.title);
}

Network.prototype.updatePlayerList = function(data, alert=true){
    var nameList = [];
    if(!window.players) window.players = {};

    var oldKeys = Object.keys(window.players);
    var newKeys = Object.keys(data);

    for(var player in data){
        var name = getPlayerName(data[player]);

        // if new player
        if(alert && data[player].id != undefined && !oldKeys.includes(player) && player != window.playerID)
            window.createToast(`${name} has joined the room.`)

        window.players[player] = data[player];
        nameList.push({"id":data[player].id, "name":name});
    }        

    for(var key in oldKeys){
        if(!newKeys.includes(oldKeys[key])){
            window.createToast(`${getPlayerName(window.players[oldKeys[key]])} has left the room.`)
            delete window.players[oldKeys[key]];
        }
    }

    let playerListContainer = document.getElementById("player-list");
    playerListContainer.innerHTML = ''; //remove list and replace with new list

    let playerList = [];
    for(var player in nameList){
        let listEntry = document.createElement("a");
        listEntry.setAttribute('class', 'list-group-item list-group-item-action');
        listEntry.setAttribute('href', '#');
        // listEntry.setAttribute('onclick', "pc.app.fire('changeName')");
        listEntry.text = nameList[player].name;

        if(nameList[player].id == window.playerID){
            listEntry.setAttribute('class', 'list-group-item list-group-item-action active');
            listEntry.setAttribute('id', 'player-id-list-entry');
            listEntry.setAttribute('onclick', 'pc.app.fire("showTextInputDiv-changeAlias");');
            listEntry.setAttribute('aria-current', 'true');
            
            playerListContainer.prepend(listEntry);
        }
        else playerListContainer.append(listEntry);
        
    }
}

Network.prototype.giveTiles = function(data){
    var tilesToGive = data;
    window.isStuck = false;

    for(var i in tilesToGive){
        var newtile = this.tiletemplate.resource.instantiate(); // creat tile entity


        newtile.script.tile.setLetterAndPoints(tilesToGive[i][0], tilesToGive[i][1])
              

        this.app.root.addChild(newtile);
        newtile.script.tile.returnToTray();
    }
}

Network.prototype.gameFinish = function(data){
    pc.app.fire('gameFinish');
    this.app.root.findByName("Camera").enabled = false;
    $("#mainMenuBackdrop").addClass("show")
    var allWords = this.app.root.findByName("Board").script.boardManager.getWordGroupingsTest(undefined, finalScoring=true);
    // this.app.root.findByName("Board").enabled = false;
    var tileTray = this.app.root.findByName('tileTray');
    // tileTray.enabled = false;

    if(allWords == undefined || allWords == null)
        window.socket.emit('giveFinalScore', [], [], [], tileTray.script.tileTrayManager.getLettersOfTilesInTray());
    else
        window.socket.emit('giveFinalScore', allWords[0], allWords[1], allWords[2], tileTray.script.tileTrayManager.getLettersOfTilesInTray());


}

function getPlayerName(player){
    if(!player) return;

    var name = ""
    if(player.alias)
        name = player.alias;
    else
        name = player.id;
    return name;
}

Network.prototype.showFinalScores = function(data){
    $("#winner-id").empty()
    $("#winner-score").empty()
    $("#winner-total-score").empty()
    $("#winner-wordsused").empty()
    $("#loser-scores-table").empty();
    $("#winner-top-three-words").empty();

    $("#winner-id").text(getPlayerName(Object.values(data)[0][2]));
    $("#winner-score").text(Object.values(data)[0][2].finalScore + " Points");
    $("#winner-total-score").text(Object.values(data)[0][2].totalScore + " Total Points");
    $("#winner-wordsused").text(Object.values(data)[0][2].finalValidWords);
    
    for(var i=1; i<data.length; i++){ // skip entry 0, since that is first place.
        var loser = document.createElement('tr');
        var wordsAndScoresString = []
            for(var j=0; j<Object.values(data)[i][2].wordsAndScores.length; j++){
                wordsAndScoresString.push(Object.values(data)[i][2].wordsAndScores[j].word + ":" + Object.values(data)[i][2].wordsAndScores[j].points)
            }
        loser.innerHTML = `<th scope="row">${i+1}</th>
                                <td>${getPlayerName(Object.values(data)[i][2])}</td>
                                <td>${Object.values(data)[i][2].finalScore}</td>
                                <td>${Object.values(data)[i][2].totalScore}</td>
                                <td><button class="btn btn-primary" onclick='pc.app.fire("showAllWordsDiv", "${wordsAndScoresString}", "${getPlayerName(Object.values(data)[i][2])}")' ">Words</button></td>`
        $("#loser-scores-table").append(loser);
    }


    var winnerWordsAndScoresString = []
    
    for(var i=0; i<Object.values(data)[0][2].wordsAndScores.length; i++){
        winnerWordsAndScoresString.push(Object.values(data)[0][2].wordsAndScores[i].word + ":" + Object.values(data)[0][2].wordsAndScores[i].points)

        if(i <= 2){
            var topWord = document.createElement('tr')
            topWord.innerHTML = `<div class="row row-cols-3 p-0" style="">
                                    <div class="col col-auto p-0" style="width: fit-content;">${Object.values(data)[0][2].wordsAndScores[i].word}</div>
                                    <div class="col col-auto px-2"> : </div>
                                    <div class="col col-auto p-0" style="width: fit-content;">${Object.values(data)[0][2].wordsAndScores[i].points} points</div>
                                </div>`

            $("#winner-top-three-words").append(topWord);
        }
    }
    $("#winner-topthree").attr("onclick", `pc.app.fire("showAllWordsDiv", "${winnerWordsAndScoresString}", "${$("#winner-id").text()}")`);


    window.removeEventListener('contextmenu', function(e){
        e.preventDefault();
    });
    $("#main-menu-div").show();
    gameFinishScreen.show()
}















function showModal(){
    var button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('class', 'btn btn-primary');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#exampleModal');

    var modal = document.createElement('div');
    modal.setAttribute('class', 'modal fade');
    modal.setAttribute('id', 'exampleModal');
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'exampleModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `  <div class="modal-dialog">
                            <div class="modal-content">
                            <div class="modal-header">
                                <h1 class="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                ...
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary">Save changes</button>
                            </div>
                            </div>
                        </div>
                    `;
    document.body.appendChild(modal);
    document.body.appendChild(button);

}

//https://dev.to/amersikira/how-to-create-custom-stackable-toasts-b18
Network.prototype.initToast = function(){
    var css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: sans-serif;
    }
    #toast-holder {
    z-index: 2000;
    position: fixed;
    right: 5px;
    top: 6vh;
    width: fit-content;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    padding: 10px 10px 0 10px;
    background: #a9a9a9;
    }

    .single-toast {
    width: 100%;
    font-size: 80%;
    border-radius: 5px;
    background-color: white;
    color: #5b5b5b;
    margin-bottom: 10px;
    box-shadow: 0 5px 10px rgba(0,0,0,.5);
    transition: .3s;
    min-height: fit-content;
    display: flex;
    flex-direction: column;
    border-radius: 15px;
    overflow: hidden;
    }

    .toast-header {
    display: flex;
    justify-content: space-between;
    padding: 5px 10px;
    border-bottom: 1px solid #ccc;
    }

    .arrowDiv:before {
        z-index: -10;
        content: " ";
        position: absolute;
        background: #a9a9a9;
        width: 15px;
        height: 15px;
        top: -5px;
        left: 98%;
        margin-left: -15px;
        transform: rotate(45deg);
    }

    .close-toast {
    color: inherit;
    text-decoration: none;
    font-weight: bold;
    right: 0;
    position: absolute;
    }
    .toast-content {
    padding: 10px 10px 5px;
    }

    .fade-in {
    animation: fadeIn linear .5s;
    }

    .fade-out {
    animation: fadeOut linear .5s;
    }

    @keyframes fadeIn {
    0% {
        opacity: 0;
        max-height: 0px;
    }

    100% {
        opacity: 1;
        max-height: 100px;
    }
    }

    @keyframes fadeOut {
    0% {
        opacity: 1;
        max-height: 100px;
    }
    100% {
        opacity: 0;
        max-height: 0;
    }
    }
    .round-time-bar {
    margin: 0;
    overflow: hidden;
    }
    .round-time-bar div {
    height: 5px;
    animation: roundtime calc(var(--duration) * 1s) steps(var(--duration))
        forwards;
    transform-origin: left center;
    background: linear-gradient(to bottom, red, #900);
    }

    .round-time-bar[data-style="smooth"] div {
    animation: roundtime calc(var(--duration) * 1s) linear forwards;
    }

    .round-time-bar[data-style="fixed"] div {
    width: calc(var(--duration) * 5%);
    }


    @keyframes roundtime {
    to {
        transform: scaleX(0);
    }
    }
    `;

    var style = document.createElement('style');
        style.innerHTML = css;
        style.id = 'toast-style';

    document.body.appendChild(style);

    if (!document.querySelector("#toast-holder")) {
        container = document.createElement("div")
        container.setAttribute("id", "toast-holder");
        container.setAttribute("class", "rounded");
        container.setAttribute("style", "display:none;");
        var arrow = document.createElement("div");
        arrow.setAttribute("class","arrowDiv");
        arrow.setAttribute("style", "display:none;");
        container.appendChild(arrow);
        document.body.appendChild(container);
    }

    // var confetti = document.createElement('script');
    // confetti.src = 'src="https://cdn.jsdelivr.net/npm/@tsparticles/confetti@3.0.3/tsparticles.confetti.bundle.min.js"';
    // document.body.appendChild(confetti);
}

window.createToast = function(message, time=5000, messageColor="#9ef89e", header="") {
    if(!message) return;

    //Create empty variable for toasts container
    let container;
    //If container doesn't already exist create one
    if (!document.querySelector("#toast-holder")) {
        container = document.createElement("div")
        container.setAttribute("id", "toast-holder");
        container.setAttribute("class", "rounded");
        var arrow = document.createElement("div");
        arrow.setAttribute("class","arrowDiv");
        container.appendChild(arrow);
        document.body.appendChild(container);
    } else {
        // If container exists asign it to a variable
        container = document.querySelector("#toast-holder");
        if($("#toggleToastsBtn").data("toggled") == "on")
            $("#toast-holder").show();
    }
    // $("#toast-holder").css("background", "#a9a9a980");

    var smallTime = time / 1000;
    var moddedColor = ModColor(messageColor, -40);
    //Create our toast HTML and pass the variables heading and message
    let toast = document.createElement("div");
    toast.setAttribute("class", "single-toast fade-in");
    toast.setAttribute("onclick", `document.querySelector("#toast-holder").removeChild(this)`);
    toast.innerHTML = `
                    <div class="toast-header" style="background:linear-gradient(to top, ${messageColor}, ${moddedColor});">
                        <span class="toast-heading">${header}</span>
                    </div>
                    <div class="toast-content" style="animation: roundtime calc(var(--duration) * 1s) steps(var(--duration)) forwards;">
                        ${message}
                    </div>
                    <div class="round-time-bar" data-style="smooth" style="--duration: ${smallTime};">
                    <div style="background:linear-gradient(to bottom, ${messageColor}, ${moddedColor})"></div>
                    </div>
                    `;

    // Once our toast is created add it to the container
    // along with other toasts
    container.appendChild(toast);
    $("#toastcount").text($(".single-toast").length);
    setTimeout(function() {
        toast.setAttribute("class", "single-toast fade-out");
        setTimeout(function() {
            if(Array.prototype.slice.call(container.children).includes(toast)){
                container.removeChild(toast);
                $("#toastcount").text($(".single-toast").length);
                if(container.childElementCount == 1)
                        $("#toast-holder").hide();

            }
        }, 500);
    }, time);
    if(container.clientHeight > pc.app.graphicsDevice.canvas.clientHeight*.2 && container.children[1]){
        container.removeChild(container.children[1]);
        $("#toastcount").text($(".single-toast").length);
    }
}

function ModColor(color, adjustBy) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + adjustBy)).toString(16)).substr(-2));
}


function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}