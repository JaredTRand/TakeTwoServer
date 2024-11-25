var BoardSpace = pc.createScript('boardSpace');

// initialize code called once per entity
BoardSpace.prototype.initialize = function() {
    this.tile = null; //will get set when player places tile down
    this.spaceLeft = null;
    this.spaceRight = null;
    this.spaceUp = null;
    this.spaceDown = null;
    this.spaceID = null;
};

// update code called every frame
BoardSpace.prototype.update = function(dt) {

};

BoardSpace.prototype.addTile = function(tile){
    if(this.tile) // if space already has tile
        tile.script.tile.returnToTray();

    this.tile = tile
    this.entity.parent.script.boardManager.tilesOnBoard.push(tile)

    if(!tile.isBlank) // blanks get fired when letter is selected
        this.app.fire("boardchanged", this.entity);
}
BoardSpace.prototype.removeTile = function(){
    var tilesInPlay = this.entity.parent.script.boardManager.tilesOnBoard;
    var tileloc = tilesInPlay.indexOf(this.tile);
    if(tileloc > -1)
        tilesInPlay.splice(tileloc, 1);

    //when removing, find other tile to latch onto
    var returnTile;
    if(this.entity.spaceLeft && this.entity.spaceLeft.script.boardSpace.tile)
        returnTile = this.entity.spaceLeft;
    else if(this.entity.spaceRight && this.entity.spaceRight.script.boardSpace.tile)
        returnTile = this.entity.spaceRight;
    else if(this.entity.spaceUp && this.entity.spaceUp.script.boardSpace.tile)
        returnTile = this.entity.spaceUp;
    else if(this.entity.spaceDown && this.entity.spaceDown.script.boardSpace.tile)
        returnTile = this.entity.spaceDown;
    else
        returnTile = this.entity

    this.tile = null
    this.app.fire("boardchanged", returnTile);
}