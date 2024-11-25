var BoardManager = pc.createScript('boardManager');
BoardManager.attributes.add("defaultrowsnum", {type: "number", default: 2, title: "Default Number of Rows On Board", 
    description: "Number of Rows"});
BoardManager.attributes.add("defaultcolsnum", {type: "number", default: 15, title: "Default Number Of Columns On Board", 
    description: "Default Columns"});
BoardManager.attributes.add("boardspaceTemplate", {type: "asset", assetType:'template', title: "Board Space Template", 
    description: "Template to use for board generation"});
    

    
// initialize code called once per entity
BoardManager.prototype.initialize = function() {
    this.board = this.app.root.findByName('Board');
    this.gameMaster = this.app.root.findByName('Root').script.gameMaster;
    this.tileTray = this.app.root.findByName('tileTray');
    this.playerCamera = this.app.root.findByName('Camera');

    this.Rows = [];
    this.Cols = [];

    this.validWords = [];
    this.validTiles = [];
    this.invalidWords = [];
    this.invalidTiles = [];

    this.connectedSpaces = [];
    this.checkedSpaces = [];

    this.tilesOnBoard = [];

    this.app.on('boardchanged', this.getWordGroupingsTest, this);
    // this.app.on('gameFinish', this.gameFinish, this);
    this.on('destroy', function(){
        this.app.off('boardchanged', this.getWordGroupingsTest, this);
        // this.app.off('gameFinish', this.gameFinish, this);
    });
    this.createBoard();

    




    /* SET camera start position to the center of the board */
    var newPos = this.playerCamera.position.clone();
    
    var middleRowPos = this.Rows[1][this.Rows.length/2].position.x; 
    var middleColPos = this.Cols[1][this.Cols.length/2].position.z; 

    newPos.x = middleRowPos;
    newPos.z = middleColPos;
    this.playerCamera.setPosition(newPos);
};

// update code called every frame
BoardManager.prototype.update = function(dt) {
};

BoardManager.prototype.generateRow = function(rownum) {
    var newRow = [];
    for(var i=0; i<this.defaultcolsnum; i++){
        var newBoardSpace_R = this.boardspaceTemplate.resource.instantiate();
        var pos_r = new pc.Vec3(i, -.5, this.Rows.length);
        newBoardSpace_R.setLocalPosition(pos_r);

        
        newBoardSpace_R.spaceLeft  = null;
        if(i != 0)
             newBoardSpace_R.spaceLeft = newRow[i-1]; 

        //space to the right is null, since hasn't been created
        newBoardSpace_R.spaceRight  = null;
        if(i != 0) // if not the first in the row, set left space's right to the new one
            newRow[i-1].spaceRight = newBoardSpace_R
        
        newBoardSpace_R.spaceUp   = null;
        newBoardSpace_R.spaceDown = null;
        if(this.Rows.length > 0){
            newBoardSpace_R.spaceUp = this.Rows[this.Rows.length - 1][i];
            this.Rows[this.Rows.length - 1][i].spaceDown = newBoardSpace_R;
        }

        newBoardSpace_R.spaceID = rownum.toString() + "_" + i.toString()
        this.board.addChild(newBoardSpace_R);
        newRow.push(newBoardSpace_R);
        
        if(this.Cols.length > i){
            this.Cols[i].push(newBoardSpace_R);
        }
        else{
            var newCol = [];
            newCol.push(newBoardSpace_R);
            this.Cols.push(newCol);
        }
    }
    this.Rows.push(newRow);
}

BoardManager.prototype.createBoard = function() {
    for(var i=0; i<this.defaultrowsnum; i++){
        this.generateRow(i);
    }
}

BoardManager.prototype.getWordGroupingsTest = function(currentspace, finalScoring=false){
    if(!currentspace){
        if(this.tilesOnBoard.length == 0 || !this.tilesOnBoard[0] || !this.tilesOnBoard[0].parent)
            return; 
        currentspace = this.tilesOnBoard[0].parent;
    }
    this.validWords = [];
    this.invalidWords = [];
    this.invalidTiles = [];
    this.connectedSpaces = [];
    this.checkedSpaces = [];
    this.wordGroupings = [];


    var firstGrouping = this.getWordGroupingFromTile(currentspace);
    if(!firstGrouping) 
        return;
    // if(firstGrouping.length == 0 && currentspace.script.boardSpace.tile)
    //     firstGrouping = [{key:currentspace.script.boardSpace.tile.script.tile.letter, value:[currentspace]} ];

    this.wordGroupings.push( firstGrouping );
    var allTilesInAllGroupings = this.getAllTilesInGrouping(firstGrouping);

    // console.log(this.wordGroupings);

    //if true, then not all the tiles are in the grouping. so we gotta find all the groupings
    var count = 0;
    if(allTilesInAllGroupings.length != this.tilesOnBoard.length){
        while(true){
            if(allTilesInAllGroupings.length >= this.tilesOnBoard.length || count >= 20)
                break;

            // find a tile that's not in all tiles, get grouping from that.
            var rogueTile = this.getThisThatsNotInThat(this.tilesOnBoard, allTilesInAllGroupings);
            var newGrouping = this.getWordGroupingFromTile(rogueTile.parent);
            if(!newGrouping) break;

            var tilesInGrouping = this.getAllTilesInGrouping(newGrouping);
            for(var i in tilesInGrouping){
                if(!allTilesInAllGroupings.includes(tilesInGrouping[i]))
                    allTilesInAllGroupings.push(tilesInGrouping[i]);
            }

            this.wordGroupings.push(newGrouping);
            count++;
        }
    }

    if(this.wordGroupings.length > 1){
        var largestGroup = this.wordGroupings[0];

        for(var group in this.wordGroupings){
            var currentTiles = this.getAllTilesInGrouping(this.wordGroupings[group])
            if( currentTiles.length > this.getAllTilesInGrouping(largestGroup).length )
                largestGroup = this.wordGroupings[group];
        }
        while(true){
            if(this.wordGroupings.length <= 1)
                    break;
                for(var group in this.wordGroupings){
                if(this.wordGroupings[group] == largestGroup)
                    continue;
                
                this.invalidateGroup(this.wordGroupings[group]);
                this.wordGroupings.splice(group, 1); //reduce back to 1 grouping, invalidate the rest
            } //TODO figure out why the splice doesnt splice correctly all the time.
        }
    }

    if(!this.wordGroupings[0])
        return;
    
    this.changeTilesColors( this.getAllTilesInGrouping(this.wordGroupings[0]), pc.Color.WHITE);
    this.validateGroup( this.wordGroupings[0] );

    // console.log("Invalid Words:");
    // console.log(this.invalidWords);
    // console.log("Valid Words:");
    // console.log(this.validWords);

    // if final scoring, we don't need to check for taketwos
    if(finalScoring){
        var finalBlanks = [];
        for(var tiles in allTilesInAllGroupings){
            if(allTilesInAllGroupings[tiles].script.tile.isBlank)
                finalBlanks.push(allTilesInAllGroupings[tiles].script.tile.letter);
        }

        return [this.validWords, this.invalidWords, finalBlanks];
    } 

    if(this.validWords.length > 0 &&    // if there are valid words
       this.invalidWords.length == 0 &&     // and no invalid words
       this.tileTray.script.tileTrayManager.tilesInTray.length == 0 &&  // and there are no letters in the tray
       this.tileTray.script.tileTrayManager.tilesGiven.length == this.tilesOnBoard.length) 
       window.socket.emit("takeTwo"); //this may eventually need to carry player name/id whatever
}

BoardManager.prototype.validateGroup = function(group){
    var tilesToTurnRed = [];
    for(var word in group){
        var newWord = group[word].key;
        var isvalid = this.gameMaster.checkWord(newWord);

        if(isvalid){
            for(var space in group[word].value){
                this.changeTileColor( group[word].value[space].script.boardSpace.tile, pc.Color.WHITE);
            }
            this.validWords.push(group[word].key);
        }else{
            for(var space in group[word].value){
                tilesToTurnRed.push(group[word].value[space].script.boardSpace.tile)
                // this.changeTileColor( group[word].value[space].script.boardSpace.tile, pc.Color.RED);
            }
            this.invalidWords.push(group[word].key);
        }
        
    }
    for(var tile in tilesToTurnRed){
            this.changeTileColor( tilesToTurnRed[tile], pc.Color.RED);
            this.invalidTiles.push(tilesToTurnRed[tile]);
    }
}

BoardManager.prototype.invalidateGroup = function(group){
    for(var word in group){
        for(var space in group[word].value){
            this.changeTileColor( group[word].value[space].script.boardSpace.tile, pc.Color.RED);
            this.invalidTiles.push(group[word].value[space].script.boardSpace.tile);
        }
        this.invalidWords.push(group[word].key);
    }
}

BoardManager.prototype.changeTileColor = function(tileToChange, color){
        tileToChange.script.tile.changeTextColor(color);
}
BoardManager.prototype.changeTilesColors = function(tilesToChange, color){
    for(var i in tilesToChange){
        tilesToChange[i].script.tile.changeTextColor(color);
    }
}


/*

Put down a letter, and it checks every word that it's connected to (get grouping)
after getting every connected word, check if there are any tiles that are not connected (from get grouping)

if there are, get that grouping

after getting every grouping, mark the largest as valid
check validity of the words in the grouping.

*/
BoardManager.prototype.getAllTilesInGrouping = function(grouping){
    var tilesInGroup = [];

    for(var group in grouping){
        for(var space in grouping[group].value){
            var space = grouping[group].value[space];
            if(!tilesInGroup.includes(space.script.boardSpace.tile))
                tilesInGroup.push(space.script.boardSpace.tile);
        }
    }

    return tilesInGroup;
}

// find an element of thisthing that is not in thatthing
BoardManager.prototype.getThisThatsNotInThat = function(thisthing, thatthing){
    for(var i in thisthing){
        if( !thatthing.includes(thisthing[i]) )
            return thisthing[i];
    }

    return null;
}

BoardManager.prototype.getWordGroupingFromTile = function(currentspace, wordsGrouping=[]){
    if(!currentspace)
        return;
    if(!currentspace.tags.has("space"))
        return;
    if(!currentspace.script.boardSpace.tile)
        return;
    if((!currentspace.spaceLeft  || !currentspace.spaceLeft.script.boardSpace.tile)     && 
       (!currentspace.spaceRight || !currentspace.spaceRight.script.boardSpace.tile)    && 
       (!currentspace.spaceUp    || !currentspace.spaceUp.script.boardSpace.tile)       && 
       (!currentspace.spaceDown  || !currentspace.spaceDown.script.boardSpace.tile))
        return [{key:currentspace.script.boardSpace.tile.script.tile.letter, value:[currentspace]} ];
    

    if((currentspace.spaceLeft && currentspace.spaceLeft.script.boardSpace.tile)  || (currentspace.spaceRight && currentspace.spaceRight.script.boardSpace.tile)){
        var leftmost = currentspace;
        var LRspaces = [];
        var thiswordconnectedspaces = [];

        //if picking up piece, different letter needs to be leftmost.
        //if at beginning of word, make it the letter to the right
        //if at end, make it letter to the left
        if(!leftmost.script.boardSpace.tile){
            leftmost = leftmost.spaceRight;
            if(!leftmost.script.boardSpace.tile)
                leftmost = leftmost.spaceLeft;
        }
            

        //if space left of current space has tile, keep going until space doesnt have tile (or space)
        
        while(leftmost.spaceLeft && leftmost.spaceLeft.script.boardSpace.tile){
            leftmost = leftmost.spaceLeft;
        }

        var currentIndex = leftmost;
        var currentWord = leftmost.script.boardSpace.tile.script.tile.letter;
        LRspaces.push(currentIndex);
        if((currentIndex.spaceUp && currentIndex.spaceUp.script.boardSpace.tile) || 
           (currentIndex.spaceDown && currentIndex.spaceDown.script.boardSpace.tile)){
            if(!this.connectedSpaces.includes(currentIndex))
                this.connectedSpaces.push(currentIndex);
        }
        //going from left to right, pickup up any spaces that have tiles
        while(currentIndex.spaceRight && currentIndex.spaceRight.script.boardSpace.tile){
            currentIndex = currentIndex.spaceRight;    
            currentWord += currentIndex.script.boardSpace.tile.script.tile.letter;
            LRspaces.push(currentIndex);

            if((currentIndex.spaceUp && currentIndex.spaceUp.script.boardSpace.tile) || (currentIndex.spaceDown && currentIndex.spaceDown.script.boardSpace.tile)){
                if(!this.connectedSpaces.includes(currentIndex))
                    this.connectedSpaces.push(currentIndex);
            }
        }       

        // var wordValid = this.gameMaster.checkWord(currentWord);
        var newWordAndSpaces = {key:currentWord, value:LRspaces};
        var addNewWord = true;
        for(var i in wordsGrouping){
            if(this.shallowEqual(wordsGrouping[i], newWordAndSpaces))
                addNewWord = false; //if  exactly the same as existing word
        }
        if(addNewWord) wordsGrouping.push(newWordAndSpaces);
        
    }

    if((currentspace.spaceUp && currentspace.spaceUp.script.boardSpace.tile)  || (currentspace.spaceDown && currentspace.spaceDown.script.boardSpace.tile)){
        var upmost = currentspace;
        var UDspaces = [];
        var thiswordconnectedspaces = [];

        if(!upmost.script.boardSpace.tile){
            upmost = upmost.spaceDown;
            if(!upmost.script.boardSpace.tile)
                upmost = upmost.spaceUp;
        }

        //if space up of current space has tile, keep going until space doesnt have tile
        while(upmost.spaceUp && upmost.spaceUp.script.boardSpace.tile){
            upmost = upmost.spaceUp;
        }


        var currentIndex = upmost;
        var currentWord = upmost.script.boardSpace.tile.script.tile.letter;     
        UDspaces.push(currentIndex);       
        if((currentIndex.spaceLeft && currentIndex.spaceLeft.script.boardSpace.tile) || (currentIndex.spaceRight && currentIndex.spaceRight.script.boardSpace.tile)){
            if(!this.connectedSpaces.includes(currentIndex))
                this.connectedSpaces.push(currentIndex);
        }
        //going from left to right, pickup up any spaces that have tiles
        while(currentIndex.spaceDown && currentIndex.spaceDown.script.boardSpace.tile){
            currentIndex = currentIndex.spaceDown;    
            currentWord += currentIndex.script.boardSpace.tile.script.tile.letter;
            UDspaces.push(currentIndex);
            if((currentIndex.spaceLeft && currentIndex.spaceLeft.script.boardSpace.tile) || (currentIndex.spaceRight && currentIndex.spaceRight.script.boardSpace.tile)){
                if(!this.connectedSpaces.includes(currentIndex))
                    this.connectedSpaces.push(currentIndex);
            }
               
        }

        // var wordValid = this.gameMaster.checkWord(currentWord);
        var newWordAndSpaces = {key:currentWord, value:UDspaces};
        var addNewWord = true;
        for(var i in wordsGrouping){
            if(this.shallowEqual(wordsGrouping[i], newWordAndSpaces))
                addNewWord = false; //if exactly the same as existing word
        }
        if(addNewWord) wordsGrouping.push(newWordAndSpaces);
    }

    for(var i in this.connectedSpaces){
        if(!this.checkedSpaces.includes(this.connectedSpaces[i])){
            this.checkedSpaces.push(this.connectedSpaces[i]);
            this.getWordGroupingFromTile(this.connectedSpaces[i], wordsGrouping);
        } 
    }

    return wordsGrouping;
}

BoardManager.prototype.getAllRows = function(){
    var rows = [];
    for(var row in this.Rows){
        for(var space in this.Rows[row]){
            rows.push(this.Rows[row][space]);
        }
    }
    return rows;
}


BoardManager.prototype.isInArray = function(curArray, data){
    for(var i in curArray){
        if(curArray[i].key == data.key){
            var is_same = (curArray[i].value.length == data.value.length) && curArray[i].value.every(function(element, index) {
                return element === data.value[index]; }); 
            return is_same
        }
    }
    return false;
}

// BoardManager.prototype.gameFinish = function(data){
//     this.getWordGroupingsTest();
//     window.socket.emit("giveFinalScore", this.validWords, this.invalidWords);
// }

BoardManager.prototype.shallowEqual = function(object1, object2) {
  const keys1 = object1.value;
  const keys2 = object2.value;

  if (keys1.length !== keys2.length) {
    return false;
  }

    for(var i=0; i<keys1.length; i++){
        if(keys1[i] != keys2[i]) return false;
    }

//   for (let key of keys1) {
//     if (object1[key] !== object2[key]) {
//       return false;
//     }
//   }

  return true;
}