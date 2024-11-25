var Tile = pc.createScript('tile');
Tile.attributes.add("lerpSpeed", {type: "number", default: 12, title: "Lerp Speed", 
    description: "Lerp speed to follow mouse/touch"});

Tile.attributes.add("blankLetterSelect", {type: "asset", assetType: 'template', title: "Blank Letter Select Popup", 
    description: ""});

// initialize code called once per entity
Tile.prototype.initialize = function() {
    this.cameraEntity = this.app.root.findByName('Camera');
    this.tileTray     = this.app.root.findByName('tileTray');
    this.pos = new pc.Vec3();
    this.beingDragged = false;
    
    this.unshrunkSize = this.entity.collision.halfExtents.clone();
    this.unshrunkScale = this.entity.getLocalScale().clone();
    this.returnToTray();

    this.isShrunk = false;

    if(this.letter == "")
        this.isBlank = true;
    else
        this.isBlank = false
};

// update code called every frame
Tile.prototype.update = function(dt) {
    // we dont need tiles to be free floating yet, so can just have it move with mouse, or move to parent
    if(this.beingDragged){
        //console.log("dragging?  " + this.beingDragged);
        var mousePos = this.cameraEntity.script.raycast.mousePos;
        var below = this.raycastDown();
        if(below)
            mousePos.y = below.entity.position.y + .3;
        else mousePos.y = 1;
        this.lerp_to(mousePos, dt);


        // console.log(this.pos);
    }else{
        if(this.entity.parent){
            if(this.entity.parent.entity)
                this.lerp_to(this.entity.parent.entity.getPosition(), dt);
            else
                this.lerp_to(this.entity.parent.getPosition(), dt);
        }else{
        this.returnToTray();
        }

    }   
        
};

Tile.prototype.lerp_to = function(targetPos, dt){
    var position = this.entity.getPosition();
    position.lerp(position, targetPos, this.lerpSpeed * dt);

    // Update the entity's position to the lerped position
    this.entity.setPosition(position);
}

Tile.prototype.startDragging = function(){
    // this.pos = this.cameraEntity.script.raycast.mousePos;
    this.beingDragged = true;

    if(this.entity.parent){
        if(this.entity.parent.tags.has("space"))
            this.entity.parent.script.boardSpace.removeTile();
    }
    this.doReparent(this.app.root);
        

    this.entity.castShadows = true;
    this.entity.receiveShadows = true;
}
Tile.prototype.stopDragging = function(){
    this.beingDragged = false;
    var result = this.raycastDown();
    if(result){
        if(result.entity.tags.has('space')){
            this.tileTray.script.tileTrayManager.removeTileFromTray(this.entity, result.entity);

            if(this.isBlank){
                this.doReparent(result.entity);
                window.blankTileToChange = this.entity;
                // $("#tileChangeData").data("tileToChange", this.entity);
                // $("#tileChangeData").data("tileToChangeParent", result.entity);
                pc.app.fire("blankLetterprompt");
                return;
            }
            // TODO do a stats thing, like have "# of tiles placed" for this player and then add it to an all player total
            result.entity.script.boardSpace.addTile(this.entity);
        }else this.returnToTray();
        
    }else this.returnToTray();
    
}

Tile.prototype.raycastDown = function(){
    var from = this.entity.getPosition();
    var to   = from.clone();
    to.y = to.y - 20;
    return this.app.systems.rigidbody.raycastFirst(from, to);
}

Tile.prototype.returnToTray = function(){
    if(this.entity.parent){
        if(this.entity.parent.tags.has('space'))
            this.entity.parent.script.boardSpace.removeTile();
        else if(this.entity.parent.tags.has("tileposition"))
            return;
    }

    if(this.isBlank){
        // pc.app.fire("destroyPopups");
        this.setLetterAndPoints("","");
    }

    this.entity.castShadows = false;
    this.entity.receiveShadows = false;
    this.changeTextColor(pc.Color.WHITE);


    
    this.tileTray.script.tileTrayManager.addTileToTray(this.entity);
    // console.log(this.entity.parent.name);
}

Tile.prototype.setLetterAndPoints = function(letter, points){
    this.letter = letter.toUpperCase();
    this.points = points;
    if(this.letter == "BLANK"){
        this.letter = "";
        this.points = "";
    }
        

    this.entity.findByName("tileText").element.text = this.letter;
    this.entity.findByName("tilePoints").element.text = this.points;
}

Tile.prototype.changeTextColor = function(color){
    var letter = this.entity.findByName("tileText").element;
    var points = this.entity.findByName("tilePoints").element;

    letter.color = color;
    points.color = color;
}

Tile.prototype.shrinkTile = function(scale){
    if(scale == undefined) scale = this.entity.getLocalScale().clone();
    if(this.cameraEntity.camera.projection == 1){
        // when returning to tray, shrink collision
        
        var orthoHeight = this.cameraEntity.camera.orthoHeight;

        var newscale = this.entity.collision.halfExtents;
        newscale.x *= orthoHeight*2;
        newscale.y *= orthoHeight*2;
        newscale.z *= orthoHeight*2;
        this.entity.collision.halfExtents = newscale;

        var unshrunkScale = this.unshrunkScale.clone()
        scale.x = unshrunkScale.x * orthoHeight*2;
        scale.y = unshrunkScale.y * orthoHeight*2;
        scale.z = unshrunkScale.z * orthoHeight*2;
        // console.log(newscale);
        
    }else{
        // when returning to tray, shrink collision
        var newscale = this.entity.collision.halfExtents;
        newscale.x *= .25;
        newscale.y *= .25;
        newscale.z *= .25;
        this.entity.collision.halfExtents = newscale;
    }

    this.isShrunk = true;
    return scale;
}
Tile.prototype.enlargeTile = function(scale){
    scale = this.unshrunkScale.clone()
    var newhalfextents = this.unshrunkSize.clone()

    var newscale = this.entity.collision.halfExtents;
    newscale.x = newhalfextents.x;
    newscale.y = newhalfextents.y;
    newscale.z = newhalfextents.z;
    this.entity.collision.halfExtents = newscale;
    
    this.isShrunk = false;
    return scale;
}

Tile.prototype.doReparent = function(newParent){
    var pos = this.entity.getPosition().clone();
    var rot = this.entity.getRotation().clone();
    var scale = this.entity.getLocalScale().clone();

    var isShrunk = (this.entity.collision.halfExtents.x < .5 || this.entity.collision.halfExtents.y < .06 || this.entity.collision.halfExtents.z < .5)
    if(newParent.tags.has("tileposition") && !isShrunk){ // when returning to tray, shrink collision
        scale = this.shrinkTile(scale);
    }else if(!newParent.tags.has("tileposition") && isShrunk){ // if new parent is not tray
        scale = this.enlargeTile(scale);
    }

    // if NEWPARENT isn't space or tilePosition, send back to tile manager
    this.entity.reparent(newParent);
    
    this.entity.setPosition(pos);
    this.entity.setRotation(rot);
    this.entity.setLocalScale(scale);
}