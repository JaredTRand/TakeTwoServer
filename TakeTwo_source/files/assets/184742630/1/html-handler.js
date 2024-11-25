// this script can reference html asset as an attribute
// and will live update dom and reattach events to it on html changes
// so that launcher don't need to be refreshed during development
var HtmlHandler = pc.createScript('htmlHandler');

HtmlHandler.attributes.add('html', {type: 'asset', assetType:'html', title: 'HTML Asset'});


let staticBackdrop;
let textInputDiv;
let leaveRoomprompt;
let wordlistmodal;
let gameFinishScreen;
let howToPlaymodal;
let room_browse_modal;
let blankLetterprompt;
let settingsmodal;
HtmlHandler.prototype.initialize = function() {
    // create DIV element
    this.element = document.createElement('div');
    // this.element.classList.add('container');
    this.element.id = "nav-bar-div";
    document.body.appendChild(this.element);

    this.element = document.createElement('div');
    this.element.id = "all-modals-div";
    document.body.appendChild(this.element);

    this.element = document.createElement('div');
    this.element.classList.add('container');
    this.element.id = "main-menu-div";
    document.body.appendChild(this.element);

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    var footerElement = document.createElement('div');
    footerElement.id = "mainmenufooter"
    footerElement.classList.add("container");
    footerElement.classList.add("d-flex");
    footerElement.classList.add("p-1");
    footerElement.classList.add("justify-content-center");
    footerElement.style = "bottom: 0; max-height: 75px; position: absolute; max-width: 100% !important;height: 7%;background-color: rgba(255,255,255,.3);";
    footerElement.innerHTML = `<div class="row" style="flex-wrap: nowrap; flex-direction:row;justify-content:center;">
                                    <a class="col col-1 px-1" href="https://jarofmilk.com" target="_blank" style="
                                        width: 100%;
                                        background-position: center;
                                        background-repeat: no-repeat;
                                        background-size: contain;
                                        background-image: url(&quot;https://jarofmilk.com/assets/img/taketwoimg/logo_small_bk.webp&quot;);
                                    ">                          
                                    </a>
                                    <div class="d-flex col px-1" style="height: 100%;">
                                        <div class="vr"></div>
                                    </div>
                                    <a class="col col-1 px-1" href="https://github.com/jaredtrand" target="_blank" style="
                                        width: 100%;
                                        background-position: center;
                                        background-repeat: no-repeat;
                                        background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2'/%3E%3C/svg%3E&quot;);
                                    ">                          
                                    </a>
                                    <div class="d-flex col px-1" style="height: 100%;">
                                        <div class="vr"></div>
                                    </div>
                                    <a class="col col-1 px-1 toolytip"  href="https://ko-fi.com/jarofmilk" target="_blank" style="
                                        width: 100%;
                                        position:relative;
                                        background-position: center;
                                        background-repeat: no-repeat;
                                        background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734c4.352.24 7.422-2.831 6.649-6.916m-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09c-.443-.441-3.368-3.049-4.034-3.954c-.709-.965-1.041-2.7-.091-3.71c.951-1.01 3.005-1.086 4.363.407c0 0 1.565-1.782 3.468-.963s1.832 3.011.723 4.311m6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015'/%3E%3C/svg%3E&quot;);
                                    ">   
                                        <span class="tooltiptext floating">Like The Game? Plz Buy a Coffee :)</span>                       
                                    </a>
                                    <div class="d-flex  col px-1" style="height: 100%;">
                                        <div class="vr"></div>
                                    </div>
                                    <a class="col col-1 px-1" href="https://jarofmilk.itch.io" target="_blank" style="
                                        width: 100%;
                                        background-position: center;
                                        background-repeat: no-repeat;
                                        background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23000' d='M4.172 1.787C2.776 2.615.027 5.771 0 6.599v1.375c0 1.735 1.625 3.267 3.099 3.267c1.771 0 3.251-1.469 3.251-3.213c0 1.744 1.421 3.213 3.197 3.213c1.771 0 3.151-1.469 3.151-3.213c0 1.744 1.516 3.213 3.287 3.213h.032c1.776 0 3.291-1.469 3.291-3.213c0 1.744 1.381 3.213 3.152 3.213s3.197-1.469 3.197-3.213c0 1.744 1.475 3.213 3.245 3.213c1.479 0 3.104-1.532 3.104-3.267V6.599c-.032-.828-2.776-3.984-4.177-4.812c-4.339-.156-7.344-.183-11.823-.183c-4.484.005-10.593.073-11.828.183zm8.505 8.634a3.7 3.7 0 0 1-.625.797v.005a3.73 3.73 0 0 1-2.599 1.057a3.7 3.7 0 0 1-2.599-1.063a3.4 3.4 0 0 1-.6-.787c-.167.297-.4.552-.645.787A3.7 3.7 0 0 1 3.01 12.28h-.005a1.1 1.1 0 0 1-.349-.073a55 55 0 0 0-.224 3.937v.005c-.005.527-.005.953-.011 1.552c.032 3.115-.307 10.089 1.376 11.803c2.604.604 7.396.88 12.197.885h.005c4.807-.005 9.593-.281 12.197-.885c1.683-1.713 1.344-8.688 1.376-11.803c-.005-.599-.005-1.025-.011-1.552v-.005a52 52 0 0 0-.224-3.937a1 1 0 0 1-.349.073h-.005a3.7 3.7 0 0 1-2.599-1.063h.005c-.245-.235-.479-.489-.645-.787h-.005a3.4 3.4 0 0 1-.595.787a3.71 3.71 0 0 1-5.198 0a3.6 3.6 0 0 1-.615-.787l-.011-.016c-.172.308-.38.573-.615.803a3.7 3.7 0 0 1-2.599 1.063h-.005q-.048.001-.104-.005q-.054.006-.109.005h-.005a3.7 3.7 0 0 1-2.593-1.063a3.4 3.4 0 0 1-.609-.787l-.011-.016zm-2.672 3.454c1.057.005 1.995 0 3.161 1.271c.916-.093 1.875-.14 2.833-.14s1.917.047 2.833.14c1.167-1.271 2.104-1.271 3.161-1.271h.005c.5 0 2.5 0 3.891 3.912l1.495 5.369c1.109 3.995-.355 4.095-2.177 4.095c-2.708-.1-4.208-2.068-4.208-4.037c-1.5.251-3.251.371-5 .371s-3.5-.12-4.995-.371c0 1.969-1.5 3.937-4.208 4.037c-1.828-.005-3.292-.1-2.183-4.095l1.495-5.369c1.396-3.912 3.396-3.912 3.896-3.912zM16 16.953c-.005 0-2.849 2.62-3.364 3.547l1.864-.073v1.625c0 .079.751.047 1.5.011c.749.036 1.495.068 1.495-.011v-1.625l1.869.073C18.849 19.573 16 16.953 16 16.953'/%3E%3C/svg%3E&quot;);
                                    ">                          
                                    </a>
                               </div>`;
    document.body.appendChild(footerElement);
    
    
    // asset
    this.asset = null;
    this.assetId = 0;
    this.counter = 0;



    this.app.on('createRoom', function(){
        window.socket.emit("createNewRoom");
    });


    this.app.on('startGame', function(){
        if(!window.isGameMaster){
            // console.log("You are not the Game Master.");
            return;
        }
        if(window.isGameMaster){
            var customSettings = $("#enableCustom").is(":checked");
            if(customSettings){
                if(window.tilepot) window.socket.emit('setRoomTilePot', window.tilepot, $("#tileSetCount").val());
            }
            else{
                if(window.tilepot) window.socket.emit('setRoomTilePot', window.tilepot);
            }
        }
        // window.socket.emit('startGameInRoom');
    });    
    this.app.on('gameStarted', function(){
        textInputDiv.hide();
        staticBackdrop.hide();
        $(".modal-backdrop").hide()
        $("#main-menu-div").hide();
        $("#mainmenufooter").removeClass("d-flex");
        $("#mainmenufooter").hide();
        $("#gameui-nav-bar").show();

        // $("#toast-holder").css("background-color","#a9a9a980");
        $(".arrowDiv").show();
    });

    this.app.on("goto_mainMenu", function(){
        pc.app.fire("leaveRoom");
        pc.app.fire("destroyPopups");
        $("#gameui-nav-bar").hide();
        $("#main-menu-div").show();

        $("#toast-holder").css("background","");
        $(".arrowDiv").hide();
        // loadScene("MainMenu", { hierarchy: true, settings: false });
    });
    this.app.on('showTextInputDiv-changeAlias', function(){
        textInputDiv.show();
        $("#myModal2Label").html("Change Username");
        $("#submit-text-input").attr("onclick", "pc.app.fire('changePlayerAlias');");
        $("#username-input").val("");
        $("#username-input").attr("placeholder", $("#player-id-list-entry").html());

    });
    this.app.on('showTextInputDiv-joinroom', function(){
        textInputDiv.show();
        $("#myModal2Label").html("Join Room");
        $("#submit-text-input").attr("onclick", "pc.app.fire('joinRoom');");
        $("#username-input").val("");
        $("#username-input").attr("placeholder", "Room ID");
    });
    this.app.on('BrowseRooms', function(){
        window.socket.emit("getRoomList")
    });
    this.app.on('BrowseRooms_datareturned', function(data){
        $("#browse_room_table").empty()

        for(var roomdata in data){
            var room = document.createElement("tr")
            room.innerHTML = `
                            <td>${data[roomdata].roomName}</td>
                            <td>${data[roomdata].roomStatus}</td>
                            <td>${data[roomdata].playerCount}</td>
                            <td>
                                <button onclick="pc.app.fire('joinRoom', '${data[roomdata].roomName}')" type="button" class="btn btn-primary" data-bs-dismiss="modal" aria-label="Close">Join</button>
                            </td>
                            `;
            $("#browse_room_table").append(room);
        }

        room_browse_modal.show();
    });

    this.app.on('howToPlay', function(){
        howToPlaymodal.show();
    });
    this.app.on('openSettings', function(){
        settingsmodal.show();
    });
    this.app.on('blankLetterprompt', function(){
        if(window.blankTileToChange.parent.tags.has("space"))
            blankLetterprompt.show();
    });
    this.app.on('blankLetterSelect', function(letter){
        var tile = window.blankTileToChange;
        if(!tile.parent.tags.has("space"))
            return;
        tile.script.tile.setLetterAndPoints(letter, ""); 
        tile.parent.script.boardSpace.addTile(tile);
    });
    this.app.on('blankPopupClosed', function(letter){
        window.blankTileToChange.script.tile.returnToTray();
    });
    this.app.on('leaveRoomMidgame', function(){
        leaveRoomprompt.show();
    });
    this.app.on('showAllWordsDiv', function(data, name){
        $("#word-list-modal-list").empty();

        var wordsandpoints = data.split(",");
        for(var i=0; i<wordsandpoints.length; i++){
            var listElement = document.createElement("div");
            var newWordNewPoints = wordsandpoints[i].split(":");
            listElement.setAttribute('class', 'list-group-item list-group-item-action');
            listElement.innerHTML = `          <div class="row justify-content-center">
                                                    <div class="col col-6 h4">${newWordNewPoints[0]}</div>
                                                    <div class="col col-1">
                                                        <div class="d-flex" style="height: 100%;">
                                                            <div class="vr"></div>
                                                        </div>
                                                    </div>
                                                    <div class="col col-auto">${newWordNewPoints[1]} Points</div>
                                                </div>`;
            $("#word-list-modal-list").append(listElement);
        }
        $("#word-list-modalLabel").html(name + "'s Words");
        wordlistmodal.show();
    });

    this.app.on('playerStuck', function(){
        if(window.isStuck) return;
        window.isStuck = true;

        window.socket.emit('playerStuck');
    });
    this.app.on('recallAllInvalid', function(){
        var tiles = pc.app.root.findByName("Board").script.boardManager.invalidTiles;
        for(var tile in tiles){
            tiles[tile].script.tile.returnToTray();
        }
    });
    this.app.on('toggleToasts', function(){
        var toggleState = $("#toggleToastsBtn").data("toggled");
        var container = $("#toast-holder");
        if(toggleState == "on"){
            $("#toggleToastsBtn").data("toggled", "off");
            $("#toggleToastsBtn").removeClass("btn-primary");
            $("#toggleToastsBtn").addClass("btn-info");
            $("#bellon").hide();
            $("#belloff").show();
            $("#toastcount").show();

            if(container)
                container.hide();
        }else{
            $("#toggleToastsBtn").data("toggled", "on");
            $("#toggleToastsBtn").removeClass("btn-info");
            $("#toggleToastsBtn").addClass("btn-primary");
            $("#belloff").hide();
            $("#toastcount").hide();
            $("#bellon").show();
            
            
            if(container && container.children().length > 1)
                container.show();
        }
    });
    this.app.on('createsharelink', function(){
        var roomName = $("#staticBackdropLabel").html()
        navigator.clipboard.writeText(`https://taketwo.jarofmilk.com/?room=${roomName}`);
        window.createToast("Link copied to clipboard.");
    });

    this.on('destroy', function(){
            // this.app.off('showTextInputDiv-joinroom');
            // this.app.off('showTextInputDiv-changeAlias');
            // /* this.app.off('goto_mainMenu');
            // this.app.off('gameStarted'); */
            // this.app.off('startGame');
            // this.app.off('createRoom');
    });
};


HtmlHandler.prototype.attachAsset = function(assetId, fn) {
    // remember current assetId
    this.assetId = assetId;

    // might be no asset provided
    if (! this.assetId)
        return fn.call(this);

    // get asset from registry
    var asset = this.app.assets.get(this.assetId);

    // store callback of an asset load event
    var self = this;
    asset._onLoad = function(asset) {
        fn.call(self, asset, asset.resource);
    };

    // subscribe to changes on resource
    asset.on('load', asset._onLoad);
    // callback
    fn.call(this, asset, asset.resource);
    // load asset if not loaded
    this.app.assets.load(asset);

    staticBackdrop = new bootstrap.Modal('#staticBackdrop', {
        keyboard: true
    });
    textInputDiv = new bootstrap.Modal('#myModal2', {
        keyboard: true
    });
    howToPlaymodal = new bootstrap.Modal('#tutorialModal', {
        keyboard: true
    });
    room_browse_modal = new bootstrap.Modal('#room_browse_modal', {
        keyboard: true
    });
    leaveRoomprompt = new bootstrap.Modal('#leaveRoomprompt', {
        keyboard: true
    });
    wordlistmodal = new bootstrap.Modal('#word-list-modal', {
        keyboard: true
    });
    gameFinishScreen = new bootstrap.Modal('#game-finish-screen', {
        keyboard: false
    });
    blankLetterprompt = new bootstrap.Modal('#blankLetterprompt', {
        keyboard: false
    });
    settingsmodal = new bootstrap.Modal('#settings-modal', {
        keyboard: false
    });

    var navbar = $('#gameui-nav-bar').detach();
    $("#nav-bar-div").append(navbar);
    

    var leaveRoomModal = $("#leaveRoomprompt").detach()    ;
    $("#all-modals-div").append(leaveRoomprompt);
    var blankLetterpromptdetach = $("#blankLetterprompt").detach()    ;
    $("#all-modals-div").append(blankLetterpromptdetach);



    /* vTUTORIALv */
    var onMobile = this.app.touch;
    var tutorialControlsModal = $("#tutorial-controls");
    if(onMobile){
        tutorialControlsModal.html(`
        <br><br>
        <h1 class="display-5 mb-0">Game Rules</h1><hr class="mt-0"/>
        <p>The goal is to use your tiles to make words as quick as you can. When you or someone else uses all the tiles in their tray, everyone has to "Take Two" and will pick up two additional tiles.</p>
        <p>Try to keep up with your opponents or else you might be overwhelmed with tiles.</p>
        <p>Speed isn't everything. Each word you make counts for points based on the value on the tiles. Whoever has the most points by the end of the game wins!</p>
        <p>Try to use all your tiles before the game is over. Any unused or invalid tiles will be subtracted from your total.</p>
        <br><br>
        <h1 class="display-5 mb-0">Controls</h1><hr class="mt-0"/>
        <p class="mb-0">Press and Hold a tile to move it.</p>
        <img src="${this.app.assets.find('tutorial_drag.gif').getFileUrl()}">
        <p class="mb-0 mt-5" >Release it over the space you want to place it on.</p>
        <img src="${this.app.assets.find('tutorial_place.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Quickly tap on a tile to return it to the tray. You can also press the Recall All Red button to return all invalid tiles to your tray.</p>
        <img src="${this.app.assets.find('tutorial_returntotray.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Press+hold the board and drag to move the camera.</p>
        <img src="${this.app.assets.find('tutorial_cameradrag.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Pinch/spread to zoom in and out.</p>
        <img src="${this.app.assets.find('tutorial_camerazoom.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Align Tiles in a row or column to create a word. If it's a valid word, the tile's letters will become white. If it's invalid, they will be red.</p>
        <img src="${this.app.assets.find('tutorial_words.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Wih a blank tile, you can select any letter when you place it.</p>
        <img src="${this.app.assets.find('tutorial_blanktile.gif').getFileUrl()}">
        <br>
        <p class="mb-0 mt-5">If you find that you can't make any more words with your tiles, you can press the "stuck" button. If everyone else is stuck and presses their button too, everyone will take two new tiles. </p>
        <img style="max-width: 100%; max-width: 300px;" src="${this.app.assets.find('tutorial_stuck.gif').getFileUrl()}">
        <p class="mb-0 mt-5">If the notifications annoy you, you can hide them by tapping here.</p>
        <img src="${this.app.assets.find('tutorial_toasts.gif').getFileUrl()}">
        `);
    }else{
        tutorialControlsModal.html(`
        <br><br>
        <h1 class="display-5 mb-0">Game Rules</h1><hr class="mt-0"/>
        <p>The goal is to use your tiles to make words as quick as you can. When you or someone else uses all the tiles in their tray, everyone has to "Take Two" and will pick up two additional tiles.</p>
        <p>Try to keep up with your opponents or else you might be overwhelmed with tiles.</p>
        <p>Speed isn't everything. Each word you make counts for points based on the value on the tiles. Whoever has the most points by the end of the game wins!</p>
        <p>Try to use all your tiles before the game is over. Any unused or invalid tiles will be subtracted from your total.</p>
        <br><br>
        <h1 class="display-5 mb-0">Controls</h1><hr class="mt-0"/>
        <p class="mb-0">Click and Drag a tile to start dragging it.</p>
        <img src="${this.app.assets.find('tutorial_drag.gif').getFileUrl()}">
        <p class="mb-0 mt-5" >Release it over the space you want to place it on.</p>
        <img src="${this.app.assets.find('tutorial_place.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Right Click on a tile to return it to the tray. You can also press the Recall All Red button to return all invalid tiles to your tray.</p>
        <img src="${this.app.assets.find('tutorial_returntotray.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Align Tiles in a row or column to create a word. If it's a valid word, the tile's letters will become white. If it's invalid, they will be red.</p>
        <img src="${this.app.assets.find('tutorial_words.gif').getFileUrl()}">
        <p class="mb-0 mt-5">Wih a blank tile, you can select any letter when you place it.</p>
        <img src="${this.app.assets.find('tutorial_blanktile.gif').getFileUrl()}">
        <br>
        <p class="mb-0 mt-5">If you find that you can't make any more words with your tiles, you can press the "stuck" button. If everyone else is stuck and presses their button too, everyone will take two new tiles. </p>
        <img style="max-width: 100%; max-width: 300px;" src="${this.app.assets.find('tutorial_stuck.gif').getFileUrl()}">
        <p class="mb-0 mt-5">If the notifications annoy you, you can hide them by clicking here.</p>
        <img src="${this.app.assets.find('tutorial_toasts.gif').getFileUrl()}">
        `);
    }
    /* ^TUTORIAL^ */
};


HtmlHandler.prototype.template = function(asset, html) {
    // unsubscribe from old asset load event if required
    if (this.asset && this.asset !== asset)
        this.asset.off('load', this.asset._onLoad);

    // remember current asset
    this.asset = asset;

    // template element
    // you can use templating languages with renderers here
    // such as hogan, mustache, handlebars or any other
    var imageUrl = "https://jarofmilk.com/assets/img/taketwoimg/taketwotemplogoo.jpg";
    html = html.replace('{{take-two-logo}}', imageUrl) || '';
    imageUrl = this.app.assets.find('mainBG.webp').getFileUrl();
    html = html.replace('{{mainBG}}', imageUrl) || '';
    
    this.element.innerHTML = html;

    
    // this.element.innerHTML = html;

    // bind some events to dom of an element
    // it has to be done on each retemplate
    if (html)
        this.bindEvents();
};


HtmlHandler.prototype.bindEvents = function() {
    var modal = document.getElementById("staticBackdrop");
    var btn = document.getElementById("myBtn");
    var span = document.getElementsByClassName("btn-close")[0];
};

HtmlHandler.prototype.update = function (dt) {
    // check for swapped asset
    // if so, then start asset loading and templating
    if (this.assetId !== this.html.id)
        this.attachAsset(this.html.id, this.template);
};