var GameMaster = pc.createScript('gameMaster');
GameMaster.attributes.add("tileSetNum", {type: "number", default: 2, title: "Number of Tile Sets", 
    description: "Number of 'sets' of typical game tileset"});
GameMaster.attributes.add("allWordsDictionary", {type: "asset", assetType: 'json', title: "All Words Dictionary", 
    description: "Default Dictionary"});
GameMaster.attributes.add("defaultTiles", {type: "asset", assetType: 'json', title: "Default Tile Set", 
    description: "Default Tile Set"});

// GameMaster.attributes.add("tiletemplate", {type: "asset", assetType: 'template', title: "Tile Template", 
//     description: ""});
GameMaster.attributes.add("startingTileNum", {type: "number", default: 7, title: "Number of Starting Tiles", 
    description: ""});
GameMaster.attributes.add("takeamount", {type: "number", default: 2, title: "Tile To Take", 
    description: "Number of tiles to take each 'TakeTwo'"});

    
// initialize code called once per entity
GameMaster.prototype.initialize = function() {
    this.app.fire("gameStarted");
    window.gameFinished = false;
    
    this.allWordDictArray = this.allWordsDictionary.resources;
    window.allWordsDictArray = this.allWordsDictionary.resources
    
    this.board = this.app.root.findByName("Board")
    
    window.socket.emit('initGameForPlayer');

    window.addEventListener('contextmenu', function(e){
        e.preventDefault();
    });

    $(".modal-backdrop").each(function() {
        $(this).removeClass("show");
    })

    this.app.on("restartGame", function(){
        // window.tilepot = this.generateTileSet(this.defaultTiles);
        
        if(window.tilepot) window.socket.emit('setRoomTilePot', window.tilepot);
        pc.app.fire("startGame");
    });




};

// update code called every frame
GameMaster.prototype.update = function(dt) {

};

GameMaster.prototype.checkWord = function(word){
    return window.allWordsDictArray.includes(word.toLowerCase()); // TODO HAVE SERVER SEND THIS VALUE OUT
}

GameMaster.prototype.generateTileSet = function(data){
    var newTilePot = [];
    var tileSet = data.resources[0].letters;
    for(var i=0; i < this.tileSetNum; i++){ //to create double, triple, etc tile sets
        for(var letter in tileSet){
            for(var j=0; j < tileSet[letter].tiles; j++){
                newTilePot.push(letter);
            }
        }
    }
    return {tiles:newTilePot, points:data.resources[0].letters};
}

