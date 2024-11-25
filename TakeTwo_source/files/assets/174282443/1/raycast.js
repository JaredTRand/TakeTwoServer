var Raycast = pc.createScript('raycast');
Raycast.attributes.add("doubleTapSpeed", {type: "number", default: 0.1, title: "Double Tap Speed", 
    description: "The maximum time (secs) allowed between tap and release to register as a tap"});
Raycast.attributes.add("scrollSpeed", {type: "number", default: 1.0, title: "Scroll Speed", 
    description: "Speed of scrolling in and out"});
Raycast.attributes.add('pinchZoomSpeed', {
    type: 'number', 
    default: 0.1, 
    title: 'Pinch Zoom Sensitivity', 
    description: 'How fast the camera moves in and out. Higher is faster'
});


var hitEntity = null;
// var this.lastTouch = [];
// var this.newTouch  = [];
// initialize code called once per entity
Raycast.prototype.initialize = function() {
    this.rayStart = new pc.Vec3();
    this.rayEnd   = new pc.Vec3();

    this.ray = new pc.Ray();

    this.mousePos = new pc.Vec3();

    this.dragCam  = false;
    this.draggingTile = false;

    this.lastPinchMidPoint = new pc.Vec2();
    this.lastPinchDistance = 0;
    
    this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.mouseWheel, this);

    // Add a mousedown event handler
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.mouseDown,   this);
    this.app.mouse.on(pc.EVENT_MOUSEUP,   this.mouseUp,     this);
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);

    this.timeTapAndRelease = this.doubleTapSpeed
    // Add touch event only if touch is available
    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.touchStart,  this);
        this.app.touch.on(pc.EVENT_TOUCHEND,   this.touchEnd,    this);
        this.app.touch.on(pc.EVENT_TOUCHMOVE,  this.onTouchMove, this);
    }
    
    this.on('destroy', function() {
        this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.mouseDown,   this);
        this.app.mouse.off(pc.EVENT_MOUSEUP,   this.mouseUp,     this);
        this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.mouseWheel, this);


        // Add touch event only if touch is available
        if (this.app.touch) {
            this.app.touch.off(pc.EVENT_TOUCHSTART, this.touchStart,  this);
            this.app.touch.off(pc.EVENT_TOUCHEND,   this.touchEnd,    this);
            this.app.touch.off(pc.EVENT_TOUCHMOVE,  this.onTouchMove, this);
        }   
    }, this);
};

Raycast.prototype.update = function(dt) {
    this.timeTapAndRelease += dt;
};


/***************** MOUSE INPUTS********************/ 
    /* mouse/touch down */
    Raycast.prototype.mouseDown = function (e) {
        if(window.gameFinished) return;
        this.handleRaycast(this.doRaycast(e,"tile"), e);
        this.updateCursor(e);
        e.event.preventDefault();  
    };
    /* input MOVED */
    Raycast.prototype.onMouseMove = function(e){
        if(window.gameFinished) return;

        var from = this.entity.camera.screenToWorld(e.x, e.y, this.entity.camera.nearClip);
        var to = this.entity.camera.screenToWorld(e.x, e.y, this.entity.camera.farClip);

        var result = this.app.systems.rigidbody.raycastAll(from, to);
        if (result) {
            for(var r in result){
                if(result[r].entity.tags.has("space")){
                    this.mousePos = result[r].entity.getPosition();
                }
            }
        }

        this.updateCursor(e);
        // console.log(this.mousePos);
        // console.log(e);

        if(this.dragCam) this.dragCamera(e);
    }
    //Stop dragging when not holding
    Raycast.prototype.mouseUp = function(e){
        if(window.gameFinished) return;
        if(hitEntity){
            hitEntity.script.tile.stopDragging();
        }
        this.dragCam = false;
        this.draggingTile = false;
        hitEntity = null;

        this.updateCursor(e);
    }
    Raycast.prototype.mouseWheel = function(e){
        if(window.gameFinished) return;
        if(this.entity.camera.projection == 1){
            var newheight = this.entity.camera.orthoHeight;
            newheight += this.scrollSpeed*e.wheelDelta;

            if(newheight > 0 && newheight < 20){
                this.entity.camera.orthoHeight = newheight;
                this.app.fire("orthographicResizeTiles");
            }
                
        }else{
            var newheight = this.entity.position.clone();
            newheight.y += this.scrollSpeed*e.wheelDelta;

            if(newheight.y > 5 && newheight.y < 40)
                this.entity.setPosition(newheight);
            // console.log(newheight);
        }
    }
/***************************************************/

/***************** TOUCH INPUTS********************/ 
    Raycast.prototype.touchStart = function (e) {
        if(window.gameFinished) return;
        // Only perform the raycast if there is one finger on the screen
        if (e.touches.length == 1) {
            //set current mouse position to tap position
            var from = this.entity.camera.screenToWorld(e.touches[0].x, e.touches[0].y, this.entity.camera.nearClip);
            var to = this.entity.camera.screenToWorld(e.touches[0].x, e.touches[0].y, this.entity.camera.farClip);

            var result = this.app.systems.rigidbody.raycastAll(from, to);
            if (result) {
                for(var r in result){
                    if(result[r].entity.tags.has("space")){
                        this.mousePos = result[r].entity.getPosition();
                    }
                }
            }           
            this.handleRaycast(this.doRaycast(e.touches[0],"tile"), e);

            this.lastTouch = [e.touches[0].x, e.touches[0].y];
            this.newTouch  = [e.touches[0].x, e.touches[0].y];
            this.timeTapAndRelease = 0
        }else if(e.touches.length == 2){
            this.lastPinchDistance = this.getPinchDistance(e.touches[0], e.touches[1]);
            this.calcMidPoint(e.touches[0], e.touches[1], this.lastPinchMidPoint);
        }
        e.event.preventDefault();
    };
    Raycast.pinchMidPoint = new pc.Vec2();
    Raycast.prototype.onTouchMove = function(e){
        if(window.gameFinished) return;
        var pinchMidPoint = Raycast.pinchMidPoint;
        if (e.touches.length == 1) {
            var touches = e.touches[0]
            this.lastTouch = this.newTouch;
            this.newTouch = [e.touches[0].x, e.touches[0].y];

            var from = this.entity.camera.screenToWorld(e.touches[0].x, e.touches[0].y, this.entity.camera.nearClip);
            var to = this.entity.camera.screenToWorld(e.touches[0].x, e.touches[0].y, this.entity.camera.farClip);

            var result = this.app.systems.rigidbody.raycastAll(from, to);
            if (result) {
                for(var r in result){
                    if(result[r].entity.tags.has("space")){
                        this.mousePos = result[r].entity.getPosition();
                    }
                }
            }
            if(this.dragCam) this.dragCamera(e);
        }else if(e.touches.length == 2){
            var currentPinchDistance = this.getPinchDistance(e.touches[0], e.touches[1]);
            var diffInPinchDistance = currentPinchDistance - this.lastPinchDistance;
            this.lastPinchDistance = currentPinchDistance;
                    
            var newheight = this.entity.position.clone();
            newheight.y -= diffInPinchDistance*this.pinchZoomSpeed;

            if(newheight.y > 5 && newheight.y < 40)
                this.entity.setPosition(newheight);
            // console.log(newheight);
        }
        
        //console.log("touch moved  " + this.pos);
    }
    Raycast.prototype.touchEnd = function(e){
        if(window.gameFinished) return;
        if(hitEntity){
            hitEntity.script.tile.stopDragging();

            if(this.timeTapAndRelease < this.doubleTapSpeed)
                hitEntity.script.tile.returnToTray();
        }
        this.dragCam = false;
        this.draggingTile = false;
        hitEntity = null;

        // this.lastTouch = [];
        // this.newTouch  = [];
    }


    Raycast.prototype.getPinchDistance = function (pointA, pointB) {
        // Return the distance between the two points
        var dx = pointA.x - pointB.x;
        var dy = pointA.y - pointB.y;    
        
        return Math.sqrt((dx * dx) + (dy * dy));
    };
    Raycast.prototype.calcMidPoint = function (pointA, pointB, result) {
        result.set(pointB.x - pointA.x, pointB.y - pointA.y);
        result.scale(0.5);
        result.x += pointA.x;
        result.y += pointA.y;
    };

/***************************************************/


Raycast.prototype.doRaycast = function (screenPosition, object) {   
    if(this.entity.camera.projection == 1){ //orthographic
        var farClip  = this.entity.camera.farClip;
        var nearClip = this.entity.camera.nearClip;

        this.entity.camera.screenToWorld(screenPosition.x, screenPosition.y, nearClip, this.rayStart);
        this.entity.camera.screenToWorld(screenPosition.x, screenPosition.y, farClip,  this.rayEnd);

        return this.app.systems.rigidbody.raycastFirst(this.rayStart, this.rayEnd, object);
    }else{ //perspective
        var from = this.entity.getPosition();
        var to = this.entity.camera.screenToWorld(screenPosition.x, screenPosition.y, this.entity.camera.farClip);

        return this.app.systems.rigidbody.raycastFirst(from, to);
    }

}

Raycast.prototype.handleRaycast = function(result, screenPosition){
    // If there was a hit, store the entity
    if (result) {
        if(result.entity.tags.has("tile")){
            if(screenPosition.button === pc.MOUSEBUTTON_LEFT || (screenPosition.touches != undefined && screenPosition.touches.length === 1) ){
                hitEntity = result.entity;
                hitEntity.script.tile.startDragging();
                this.draggingTile = true;
            }else if(screenPosition.button === pc.MOUSEBUTTON_RIGHT){
                result.entity.script.tile.returnToTray();
            }
        }else if(result.entity.tags.has("space")){
            if(screenPosition.button === pc.MOUSEBUTTON_LEFT || (screenPosition.touches != undefined && screenPosition.touches.length === 1) ){
                this.dragCam = true;
            }

        }

    }    
}


Raycast.prototype.dragCamera = function(e){
    if(window.gameFinished) return;
    var newPos = this.entity.position.clone();
    var scrollSpeed = newPos.y * -.001; // change speed based on how far out camera is

    if(e.touches){
        newPos.x += (this.newTouch[0] - this.lastTouch[0]) * scrollSpeed;
        newPos.z += (this.newTouch[1] - this.lastTouch[1]) * scrollSpeed;
    }else{
        newPos.x += e.dx * scrollSpeed;
        newPos.z += e.dy * scrollSpeed;
    }

    this.entity.setPosition(newPos);
    // console.log(this.entity.position);
}

Raycast.prototype.updateCursor = function(e){
    if(window.gameFinished){document.body.style.cursor = 'default'; return;}
    var result = this.doRaycast(e,"space")
    if(this.draggingTile){
        document.body.style.cursor = 'grabbing';
    }
    else if(result && result.entity.tags.has("tile")){
        document.body.style.cursor = 'pointer';
    }
    else if(result && result.entity.tags.has("space")){
        this.mousePos.y = result.entity.position.y + .3
        
        if(this.dragCam)
             document.body.style.cursor = 'grabbing';
        else document.body.style.cursor = 'grab';
    }
    else 
        document.body.style.cursor = 'default';
}