var Mainmenu = pc.createScript('mainmenu');

Mainmenu.attributes.add("tileSetNum", {type: "number", default: 2, title: "Number of Tile Sets", 
    description: "Number of 'sets' of typical game tileset"});
Mainmenu.attributes.add("allWordsDictionary", {type: "asset", assetType: 'json', title: "All Words Dictionary", 
    description: "Default Dictionary"});
Mainmenu.attributes.add("defaultTiles", {type: "asset", assetType: 'json', title: "Default Tile Set", 
    description: "Default Tile Set"});
Mainmenu.attributes.add("startingTileNum", {type: "number", default: 7, title: "Number of Starting Tiles", 
    description: ""});
Mainmenu.attributes.add("takeamount", {type: "number", default: 2, title: "Tile To Take", 
    description: "Number of tiles to take each 'TakeTwo'"});

// initialize code called once per entity
Mainmenu.prototype.initialize = function() {
    window.tilepot = this.generateTileSet(this.defaultTiles);
    
    // this.app.root.findByName("sendTileSet").button.on('click', function(event){
    //     window.socket.emit('setRoomTilePot', window.tilepot);
    // });

    // this.app.on('leaveRoom', function(){
    //     pc.app.fire("destroyPopups");
    //     window.players = {};

    //     window.socket.emit("leaveRoom");
    // });

    this.app.on('changePlayerAlias', function(){ 
        window.socket.emit("changePlayerAlias", document.getElementById("username-input").value); 
    });

    this.app.on('joinRoom', function(data){
        if(!data)
            data = document.getElementById("username-input").value.toLowerCase()
        window.socket.emit('joinRoom', data);
    });



};

Mainmenu.prototype.generateTileSet = function(data){
    var newTilePot = [];
    var tileSet = data.resources[0].letters;
    for(var i=0; i < this.tileSetNum; i++){ //to create double, triple, etc tile sets
        for(var letter in tileSet){
            for(var j=0; j < tileSet[letter].tiles; j++){
                newTilePot.push(letter);
            }
        }
    }
    return {tiles:newTilePot, points:data.resources[0].letters, tileSet:tileSet};
}

