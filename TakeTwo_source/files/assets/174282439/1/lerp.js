var Lerp = pc.createScript('lerp');

// initialize code called once per entity
Lerp.prototype.initialize = function() {
    // Set a target position for the entity to move to
    this.targetPosition = this.entity.getPosition();

    // How fast the entity will reach the target
    this.speed = 5;
};


// update code called every frame
Lerp.prototype.update = function(dt) {
    // Lerp the current position and the target position
    // More information on lerp with Vec3: http://developer.playcanvas.com/en/api/pc.Vec3.html#lerp
    var position = this.entity.getPosition();
    position.lerp(position, this.targetPosition, this.speed * dt);

    // Update the entity's position to the lerped position
    this.entity.setPosition(position);
};