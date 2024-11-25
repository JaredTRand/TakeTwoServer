var TileTrayManager = pc.createScript('tileTrayManager');
TileTrayManager.attributes.add("positionTemplate", {type: "asset", assetType: 'template', title: "Position Template", description: ""});

// initialize code called once per entity
TileTrayManager.prototype.initialize = function() {
    this.screenWidth = 0;
    this.camera = this.app.root.findByName("Camera");

    // this.sleep(1000);
    this.setTrayPos();   

    window.addEventListener('resize', function(){
        pc.app.fire("windowResized");
    }); 

    this.app.on('windowResized', function(){
        pc.app.root.findByName("tileTray").script.tileTrayManager.changeTileTrayPOSxTimes(3);
    });

    this.app.on('orthographicResizeTiles', function(){
        var tileManager = pc.app.root.findByName("tileTray").script.tileTrayManager;
        tileManager.getTilesInTray()
        for(var i in tileManager.tilesInTray){
            tileManager.tilesInTray[i].script.tile.shrinkTile();
        }
    })
    
    this.changeTileTrayPOSxTimes(11);
};

// update code called every frame
TileTrayManager.prototype.update = function(dt) {
    // this.sleep(1000);
    // if(this.tileTrayPos != this.entity.getPosition()){
    //     this.screenWidth = this.app.graphicsDevice.canvas.clientWidth;

    //     this.setTrayPos();
    // }
};



TileTrayManager.prototype.removeTileFromTray = function(tile, newParent){
    // var oldParent = tile.parent
    tile.script.tile.doReparent(newParent);
    // oldParent.destroy();

    // refresh tiles array
    this.getTilesInTray();
    this.shiftTiles(tile, "left");
}


TileTrayManager.prototype.addTileToTray = function(tile){
    if(!tile || !tile.script.tile) return; // if null or not tile
    if(this.tilesInTray && this.tilesInTray.includes(tile)) { // if tile already in tray
        for(var i in this.entity.children){
            if (this.entity.children[i].children[0] == tile){
                tile.script.tile.doReparent(this.entity.children[i]);
                return;
            }
        }
    } 

    if(!this.tilesInTray)
        this.tilesInTray = []
    if(!this.tilesInTray.includes(tile))
        this.tilesInTray.push(tile);

    if(this.tilesGiven == undefined)
        this.tilesGiven = []
    if(!this.tilesGiven.includes(tile))
        this.tilesGiven.push(tile);

    var newPos = this.findFirstEmptyPos();
    if(newPos == null){
        newPos = this.positionTemplate.resource.instantiate();
        newPos.reparent(this.entity);  
    }
    
    tile.script.tile.doReparent(newPos);
}

TileTrayManager.prototype.getTilesInTray = function(){
    var positionsInTray = this.entity.children;
    this.tilesInTray = [];

    for(var i in positionsInTray){
        if(positionsInTray[i] && positionsInTray[i].children.length > 0 && positionsInTray[i].children[0].tags.has("tile"))
            this.tilesInTray.push(positionsInTray[i].children[0])
    }
}

TileTrayManager.prototype.getLettersOfTilesInTray = function(){
    this.getTilesInTray(); 
    var lettersInTray = [];


    for(var i in this.tilesInTray){
        lettersInTray.push(this.tilesInTray[i].script.tile.letter);
    }
    return lettersInTray;
}

TileTrayManager.prototype.findFirstEmptyPos = function(){
    var positionsInTray = this.entity.children;
    for(var i in positionsInTray){
        if(positionsInTray[i] && positionsInTray[i].children && positionsInTray[i].children.length == 0)
            return positionsInTray[i];
    }
    return null;
}

TileTrayManager.prototype.shiftTiles = async function(startingTile, direction, numTiles=9999){
    this.getTilesInTray(); //refresh

    var positionsInTray = this.entity.children;
    var initialPos = this.findFirstEmptyPos();

    for(var i=positionsInTray.indexOf(initialPos); i<positionsInTray.length; i++ ){
        if(!positionsInTray.children || positionsInTray.children.length == 0){ //if empty space
            if(i+1 >= positionsInTray.length)
                return;
            var tileToShift = positionsInTray[i+1].children[0];
            if(!tileToShift)
                return;
            if(positionsInTray[i].children.length == 0)
                tileToShift.script.tile.doReparent(positionsInTray[i]);
            await this.sleep(50); //just to add a little flair
        }
    }
}

TileTrayManager.prototype.sleep = function(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

TileTrayManager.prototype.changeTileTrayPOSxTimes = async function(x){
    for(var i=0; i<x; i++){
        // pc.app.fire("windowResized");
        this.setTrayPos();
        await this.sleep(100);
    }
}

TileTrayManager.prototype.setTrayPos = function(returnVal = false){
    if(this.camera.camera.projection == 1){ //orthographic
        var oldTrayPos = this.entity.getPosition()
        var newpos = this.camera.camera.screenToWorld(0, this.app.graphicsDevice.canvas.offsetHeight, this.camera.camera.orthoHeight);
        newpos.x = newpos.x * .985;
        newpos.z = newpos.z * .973;
        this.tileTrayPos = newpos;
        this.entity.setPosition(newpos);

        newPOSleft  = this.camera.camera.screenToWorld(0, this.app.graphicsDevice.canvas.offsetHeight, oldTrayPos.z);        
        newPOSright = this.camera.camera.screenToWorld(this.app.graphicsDevice.canvas.clientWidth * 1.2, this.app.graphicsDevice.canvas.offsetHeight, oldTrayPos.z);        
        
        this.entity.element.width = (pc.Vec3.prototype.distanceBetween(newPOSleft, newPOSright));
        
        if(returnVal) return newpos;
    }else{ //perspective
        var posHeight = .83;

        var oldTrayPos = this.entity.getPosition()
        var newpos = this.camera.camera.screenToWorld(0, this.app.graphicsDevice.canvas.offsetHeight, oldTrayPos.z/3.5);
        newpos.x = newpos.x * .985;
        newpos.z = newpos.z * .973;
        this.tileTrayPos = newpos;
        
        this.entity.setPosition(newpos);

        newPOSleft  = this.camera.camera.screenToWorld(0, this.app.graphicsDevice.canvas.offsetHeight, oldTrayPos.z);        
        newPOSright = this.camera.camera.screenToWorld(this.app.graphicsDevice.canvas.clientWidth * 1.2, this.app.graphicsDevice.canvas.offsetHeight, oldTrayPos.z);        
        
        this.entity.element.width = (pc.Vec3.prototype.distanceBetween(newPOSleft, newPOSright));
        
        if(returnVal) return newpos;
    }
}

pc.Vec3.prototype.distanceBetween = function(a,b){
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}