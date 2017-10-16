/**
 * Created by gephery on 9/8/17.
 */
const BLOCK_1_C_NAME = "blockone";
const TAG_OF_BLOCK = "taggedg";
const CANVAS_TAG = "canofgame";

let dBClick = null;
let on = false;
let fLoadHappened = false;
let playerOne = null;

let blocks = [];

/**
 * Static keepers for variables related to the game running such as frame rate.
 * @constructor None.
 */
function Controller() {
}

Controller.DEFAULT_UI_LAYER_ID = 5;
Controller.DEFAULT_EFFECT_LAYER_ID = 4;
Controller.DEFAULT_PLAYER_LAYER_ID = 3;
Controller.DEFAULT_BLOCK_LAYER_ID = 2;
Controller.DEFAULT_BACKDROP_ID = 1;
Controller.CANVAS_SIZE = {height: 0, width: 0};
Controller.frameSpeed = 33;
Controller.contexts = [];
Controller.STYLE_TAG = "getstyle";
Controller.SPRITE_SHEET = "";
Controller.BACKDROP_SKIP_MAX = 30;
Controller.backdropCounter = 0;
Controller.activeEffects = [];

/**
 * Used for animating the background star array.
 * @constructor None.
 */
function Star() {
    "use strict";
}
Star.stars = []; // Keeps star here.
Star.oppac = 0.05; // Amount change.

/**
 * Given layer ids will generate canvases, inject them, and assign their contexts to the
 * Controllers context in the index of the layerID.
 * @param layerIDs The indexes of the soon to be canvas's contexts.
 */
function loadContexts(layerIDs) {
    let bodyRec = document.body.getBoundingClientRect();

    for (let i = 0; i < layerIDs.length; i++) {
        let can = document.createElement("canvas");
        can.classList.add(CANVAS_TAG);
        can.style.left = bodyRec.left;
        can.style.top = bodyRec.top;
        can.style.zIndex = layerIDs[i] * 100;
        can.width = bodyRec.width;
        can.height = bodyRec.height;

        Controller.CANVAS_SIZE = {height: bodyRec.height, width: bodyRec.width};

        Controller.contexts[layerIDs[i]] = can.getContext("2d");
        document.body.appendChild(can);
    }
}

/**
 * A util enum used for telling other functions a 2d side.
 * @constructor
 */
function SideEnum() {
    "use strict";
}

SideEnum.left = 0;
SideEnum.right = 1;
SideEnum.top = 2;
SideEnum.bottom = 3;
SideEnum.none = 4;
SideEnum.within = 5;
SideEnum.goingOut = 6;
SideEnum.goingIn = 7;

function Animations() {
    "use strict";

}

Animations.MOVE_LEFT = 0;
Animations.MOVE_RIGHT = 1;
Animations.JUMP = 2;
Animations.FALL = 3;
Animations.DEFAULT = 4;
Animations.SHOOT_LEFT = 5;
Animations.SHOOT_RIGHT = 6;
Animations.SHOOT_UP = 7;
Animations.SHOOT_DOWN = 8;

class Bullet {
    constructor(mob, side=SideEnum.right, maxTravel=100, radius=2, dx=15, dy=0, color="rgb(89, 219, 143)") {
        this.mob = mob;
        this.dx = dx;
        this.dy = dy;
        let mobBox = mob.getCollisionBox();
        switch(side) {
            case SideEnum.left:
                this.x = mobBox.left;
                this.dx = dx * -1;
                break;
            case SideEnum.right:
                this.x = mobBox.left + mobBox.width;
                break;
            case SideEnum.top:
                // Plans to shoot up maybe
                break;
            case SideEnum.bottom:
                // Plans to shoot down
                break;
        }
        this.radius = radius;
        this.maxTravel = maxTravel;
        this.y = mob.top + 15; // Magic value ;{ is how far gun is from top in sprite
        this.color = color;
    }

    isTrash() {
        return this.maxTravel <= 0;
    }

    drawMe(context) {
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.closePath();
        context.fill();
    }

    eraseMe(context) {
        // Effect screen is cleared each tic.
    }

    moveTic() {
        this.x += this.dx;
        this.y += this.dy;
        this.maxTravel -= Math.abs(this.dx);
    }
}

/**
 * The default mob object. Default is player model and functionality.
 */
class Mob {
    /**
     * Default functionality.
     * @param left X coordinate of top left.
     * @param top Y Coordinate of top left.
     * @param dx Change in x position.
     * @param dy Change in y position.
     * @param sideHop Ability to hop more than once when on a wall.
     * @param wallSlide If mob is wall sliding. Use as read only, unless changing
     *        block physics.
     * @param onGround Ability to tell if mob is on ground. Same as wallSliding.
     * @param playerDD The active jump count, 0 being no jumps left.
     * @param height Height of mob. NOTE, it is not always sprite size. More to do with
     *        hit boxing.
     * @param width Width of mob. NOTE, it is not always sprite size. More to do with
     *        hit boxing.
     * @param needsDrawUpdate {boolean} Tells the drawMe function it needs to skip the ticCount and update the frame.
     */
    constructor(left, top, dx = 0, dy = 0, sideHop = 0, wallSlide = false, onGround = false,
                playerDD = 1, height = 34, width = 7, ddMax=2,
                currAnimation=Animations.DEFAULT, blockIn=null, movementSpeed=6, fallAcceleration=1) {
        this.left = left;
        this.top = top;
        this.dx = dx;
        this.dy = dy;
        this.sideHop = sideHop;
        this.wallSlide = wallSlide;
        this.onGround = onGround;
        this.playerDD = playerDD;
        this.height = height;
        this.width = width;
        this.frameX = 9;
        this.frameY = 0;
        this.loaded = false;
        this.img = null;
        this.fallActuator = 0;

        this.ticSkip = 2;
        this.ticCount = 0;
        this.frameCount = 0;
        this.frameMax = 9;
        this.ddMax = ddMax;
        this.currAnimation = currAnimation;
        this.blockIn = blockIn;
        this.movementSpeed = movementSpeed;
        this.fallAcceleration = fallAcceleration;
        this.newMation = false;
    }

    getCollisionBox() {
        return {left: this.left + 16, top: this.top + 1, width: 7, height: 32};
    }

    setX(x) {
        this.left = x - 16;
    }

    getWidth() {
        return 7;
    }

    /**
     * Draws mob.
     * @param context Which context to draw mob on.
     */
    drawMe(context) {
        if (this.loaded) {
            // Override animations, for looping
            if (this.dx < 0) {
                this.frameY = 68;
                if (this.currAnimation != Animations.MOVE_LEFT) {
                    this.newMation = true;
                    this.currAnimation = Animations.MOVE_LEFT;
                }
            } else if (this.dx > 0) {
                this.frameY = 34;
                if (this.currAnimation != Animations.MOVE_RIGHT) {
                    this.newMation = true;
                    this.currAnimation = Animations.MOVE_RIGHT;
                }
            } else if (this.dy > 0) {
                this.frameY = 102;
                if (this.currAnimation != Animations.FALL) {
                    this.newMation = true;
                    this.currAnimation = Animations.FALL;
                }
            } else if ((this.currAnimation != Animations.SHOOT_LEFT && this.currAnimation != Animations.SHOOT_RIGHT) && this.dx == 0 && this.dy <= 0) {
                this.frameY = 0;
                if (this.currAnimation != Animations.DEFAULT) {
                    this.newMation = true;
                    this.currAnimation = Animations.DEFAULT;
                }
            }
            if (this.ticCount >= this.ticSkip || this.newMation) {
                if (this.newMation) {
                    this.frameX = 0;
                    this.frameCount = 0;
                    this.newMation = false;
                }
                switch(this.currAnimation) {
                    case Animations.MOVE_LEFT:
                        this.frameY = 68;
                        break;
                    case Animations.MOVE_RIGHT:
                        this.frameY = 34;
                        break;
                    case Animations.FALL:
                        this.frameY = 102;
                        break;
                    case Animations.SHOOT_LEFT:
                        this.frameY = 170;
                        break;
                    case Animations.SHOOT_RIGHT:
                        this.frameY = 136;
                        break;
                    default:
                        this.frameY = 0;
                        this.frameX = 0;
                        this.newMation = true;
                        break;
                }
                // Advance animation
                if (this.frameY != 0) { // No advance for default img
                    if (this.frameCount >= this.frameMax) {
                        this.currAnimation = Animations.DEFAULT;
                        this.newMation = true;
                    } else {
                        this.frameX += 34;
                        this.frameCount++;
                    }
                }

                this.ticCount = 0;
            } else {
                this.ticCount++;
            }
            context.drawImage(this.img, this.frameX, this.frameY, 34, 34, this.left, this.top, 34, 34);
        }
    }

    /**
     * Erases mob from context.
     * @param context Which context to erase mob from, should be same as one used to draw.
     */
    eraseMe(context) {
        context.clearRect(this.left - 9, this.top, 34 + 9, 34);
    }

    /**
     * To be used with clock movement. It moves player dx and dy.
     */
    moveTic() {
        this.left += this.dx;
        this.top += this.dy;
    }
}

// Setting static vars
Mob.JUMP_HEIGHT = -6;
Mob.FALL_ACTUATOR_MAX = 1;
Mob.MOVEMENT_ACCELERATION = 1;

/**
 * Default Block type.
 */
class Block {
    /**
     * Makes a Blocks.
     * @param left {Number} Please only ints.
     * @param top {Number} please only ints.
     * @param width {Number} Please only ints.
     * @param height {Number} Please only ints.
     * @param fillColor Color of block. Format with hex "#c0c6cb" or rgba(0,0,0,0) or rgb.
     * @param strokeColor Same format as fillColor.
     */
    constructor(left, top, width, height, fillColor="rgba(255, 255, 255, 0)", strokeColor="rgba(255, 255, 255, 1)") {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
    }

    /**
     * Draws block.
     * @param context Context to draw the block on.
     */
    drawMe(context) {
        context.fillStyle = this.fillColor;
        context.strokeStyle = this.strokeColor;
        context.fillRect(this.left, this.top, this.width, this.height);
        context.strokeRect(this.left, this.top, this.width, this.height);
    }

    eraseMe(context) {
        context.clearRect(this.left, this.top, this.width, this.height);
    }

    /**
     * Handles collision. If overriding block methods, use child functions
     * instead of rewriting this.
     * @param mob Mob in question.
     * @param side SideEnum representing the side of collision.
     *  Note though, side will be none on pre and post collision calls.
     */
    handleCollision(mob, side=SideEnum.none) {
        switch(side) {
            case SideEnum.left:
                this.hitLeft(mob);
                break;
            case SideEnum.right:
                this.hitRight(mob);
                break;
            case SideEnum.top:
                this.hitTop(mob);
                break;
            case SideEnum.bottom:
                this.hitBottom(mob);
                break;
            case SideEnum.within:
                this.hitWithin(mob);
                break;
            case SideEnum.goingOut:
                this.hitOut(mob);
                break;
            case SideEnum.goingIn:
                this.hitIn(mob);
                break;
        }
    }

    hitOut(mob) {

    }

    hitIn(mob) {
        Block.hitIn(mob);
    }

    static hitIn(mob) {
        mob.ddMax = Block.MOB_DD_JUMP_MAX;
        mob.movementSpeed = Block.MOB_MOVE_SPEED;
        mob.fallAcceleration = Block.MOB_FALL_ACCELERATION;
        mob.ticSkip = Block.MOB_TIC_SKIP;
    }

    hitTop(mob) {
        mob.dy = 0;
        mob.top = this.top - mob.height;
        mob.playerDD = mob.ddMax;
        mob.onGround = true;
        mob.sideHop = 0;
        mob.wallSlide = false;
    }

    hitLeft(mob) {
        mob.wallSlide = mob.dx > 0; // For wall sliding if dx in direction of block slide.
        mob.setX(this.left - mob.getWidth() - 1);
        mob.sideHop = 1;
        mob.wallSlide = true;
    }

    hitRight(mob) {
        mob.wallSlide = mob.dx < 0; // For wall sliding if dx in direction of block slide.
        mob.setX(this.left + this.width + 1);
        mob.sideHop  = -1;
        mob.wallSlide = true;
    }

    hitBottom(mob) {
        mob.dy = 0;
        mob.top = this.top + this.height + 1;
    }

    hitWithin(mob) {
        Block.hitWithin(mob);
        mob.blockIn = this;
    }

    static hitWithin(mob) {
        if (mob.fallActuator == 0) {
            if (!mob.wallSlide && !mob.onGround) {
                mob.dy += mob.fallAcceleration;
            }
            if (mob.wallSlide && !mob.onGround) {
                if (mob.dy < 0) mob.dy = mob.fallAcceleration;
                else mob.dy += mob.fallAcceleration;
            }
            mob.fallActuator = Mob.FALL_ACTUATOR_MAX;
        } else {
            mob.fallActuator--;
        }
    }

    getArea() {
        return this.width * this.height;
    }
}

Block.MOB_MOVE_SPEED = 6;
Block.MOB_DD_JUMP_MAX = 2;
Block.MOB_FALL_ACCELERATION = 1;
Block.MOB_TIC_SKIP = 2;


class Water extends Block {
    constructor(left, top, width, height, fillColor="rgba(0, 191, 255, 0)", strokeColor="rgba(255, 255, 255, 0.5)") {
        super(left, top, width, height, fillColor, strokeColor);
        this.waterPoints = [];
        let waveRate = 200;
        let waveNum = 1 + Math.floor((waveRate/ this.width));
        if (waveNum > 3) {
            waveNum = 3;
        }
        this.waveWidth = Math.floor(this.width / waveNum);
        for (let i = 0; i < waveNum; i++) {
            this.waterPoints.push(0);
        }
        this.waterUp = false;
        this.maxWaveHeight = Math.floor(this.height * .2);
        if (this.maxWaveHeight > 30) {
            this.maxWaveHeight = 30;
        }
    }

    drawMe(context) {
        let waterLevel = this.top + 1;
        //Box for water
        context.beginPath();
        context.moveTo(this.left + this.width, waterLevel);
        context.lineTo(this.left + this.width, this.top + this.height);
        context.lineTo(this.left, this.top + this.height);
        context.lineTo(this.left, waterLevel);

        //water
        for (let i = 0; i < this.waterPoints.length; i++) {
            if (this.waterUp) {
                if (this.waterPoints[i] >= this.maxWaveHeight) {
                    //this.maxWaveHeight -= 2;
                    this.waterUp = false;
                } else {
                    this.waterPoints[i]++;
                }
            } else {
                if (this.waterPoints[i] <= 0) {
                    //this.maxWaveHeight -= 2;
                    this.waterUp = true;
                } else {
                    this.waterPoints[i]--;
                }
            }
            let move = this.waterPoints[i];
            context.quadraticCurveTo(this.left + this.waveWidth * i + Math.floor(this.waveWidth / 2),
                waterLevel + move, this.left + this.waveWidth * (i+1) + (i == this.waterPoints.length - 1 ? 0 : Math.floor(move * .5)), waterLevel);
        }
        // context.quadraticCurveTo(this.left + Math.floor(this.width / 6), waterLevel + 10, this.left + Math.floor(this.width / 3), waterLevel);
        // context.quadraticCurveTo(this.left + Math.floor(this.width / 3) + Math.floor(this.width / 6), waterLevel + 10, this.left + 2*Math.floor(this.width / 3), waterLevel);
        // context.quadraticCurveTo(this.left + 2*Math.floor(this.width / 3) + Math.floor(this.width / 6), waterLevel + 10, this.left + Math.floor(this.width), waterLevel);
        context.closePath();
        context.stroke();
        context.fill();

    }

    hitTop(mob) {
        // Don't stop the player.
    }
    hitLeft(mob) {
        // Don't stop the player.
    }

    hitRight(mob) {
        // Don't stop the player.
    }

    hitBottom(mob) {
        // Don't stop the player.
    }

    hitOut(mob) {
        mob.playerDD = 0;
    }

    hitIn(mob) {
        mob.ddMax = Water.MOB_DD_JUMP_MAX;
        mob.movementSpeed = Water.MOB_MOVE_SPEED;
        mob.playerDD = Water.MOB_DD_JUMP_MAX;
        mob.fallAcceleration = Water.MOB_FALL_ACCELERATION;
        mob.ticSkip = Water.MOB_TIC_SKIP;
    }

}

Water.MOB_MOVE_SPEED = 3.3;
Water.MOB_DD_JUMP_MAX = 30;
Water.MOB_FALL_ACCELERATION = 0.2;
Water.MOB_TIC_SKIP = 4;


/**
 * Runs a check to see if game is running and if function has already be called.
 * This will set up everything necessary for running game, opposite function is unloadGame.
 */
function firstRunCheck() {
    if (!fLoadHappened) {
        loadContexts([Controller.DEFAULT_PLAYER_LAYER_ID, Controller.DEFAULT_BLOCK_LAYER_ID, Controller.DEFAULT_BACKDROP_ID, Controller.DEFAULT_EFFECT_LAYER_ID]);
        loadBlocks();
        loadPlayer();
        setEnvironment();

        document.addEventListener("keydown", keyToMovement);
        document.addEventListener("keyup", keyToStop);

        // Debug
        document.addEventListener("click", makeBlockClick);

        setTimeout(loop, Controller.frameSpeed);
        fLoadHappened = true;
        on = true;
    }
}

/**
 * Sets up css that is needed for game mode.
 */
function setEnvironment() {
    "use strict";
    let style = document.createElement("style");
    style.id = Controller.STYLE_TAG;
    document.head.appendChild(style);
    style.innerHTML = "body, div { background-color: black; color: white }";

}

/**
 * Removes css that is for game mode.
 */
function removeEnvironment() {
    "use strict";
    document.head.removeChild(document.getElementById(Controller.STYLE_TAG));
}

/**
 * Handles return messages from background.
 * @param message
 */
function handMessageCon(message) {
    "use strict";
    console.log("Received message for state = " + message.state);
    if (message.stateinfo == true) {
        on = message.state;
        if (on) {
            firstRunCheck();
        } else {
            unloadGame();
        }
    }
}

/**
 * Unloads the game, allowing a clean browser experience when wanted.
 */
function unloadGame() {
    if (fLoadHappened) {
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].el != null) blocks[i].el.classList.remove(TAG_OF_BLOCK);
        }
        blocks.length = 0;

        // Remove canvases
        let canvases = document.querySelectorAll("." + CANVAS_TAG);
        for (let i = 0; i < canvases.length; i++) {
            if (canvases[i] != null) document.body.removeChild(canvases[i]);
        }

        document.removeEventListener("keydown", keyToMovement);
        document.removeEventListener("keyup", keyToStop);
        document.removeEventListener("click", makeBlockClick);
        removeEnvironment();
        fLoadHappened = false;
        on = false;
    }
}

/**
 * General error function used by messagers.
 * @param err
 */
function handErrICons(err) {
    "use strict";
    console.log("!!Did not get on state back!! " + err + "\n");
}

/**
 * A click function to make blocks.
 * @param input
 */
function makeBlockClick(input) {
    if (on) {
        if (dBClick == null) {
            dBClick = {left: input.clientX, top: input.clientY};
        } else {
            let height = input.clientY - dBClick.top;
            let width = input.clientX - dBClick.left;
            let dbBox = new Block(dBClick.left, dBClick.top, width, height);
            dbBox.drawMe(Controller.contexts[Controller.DEFAULT_BLOCK_LAYER_ID]);

            /*end DB code */
            blocks.push({rect: {left: dBClick.left, top: dBClick.top, width: width, height: height,
                                bottom: dBClick.top + height, right: dBClick.left + width},
                                el: null, canel: dbBox});
            dBClick = null;
        }
    } else {
        dBClick = null;
    }
}

/**
 * Loads the blocks from the page.
 */
//TODO this needs a major revamp to be more flexable and allow Block "API"
function loadBlocks() {
    let rawBlocks = document.querySelectorAll("span");
    for (let i = 0; i < rawBlocks.length; i++) {
        let rawB = rawBlocks[i];
        if (!rawB.classList.contains(TAG_OF_BLOCK)) {
            /* DB code */
            let rect = rawB.getBoundingClientRect();
            let dbBox = new Block(rect.left, rect.top, rect.width, rect.height);
            dbBox.drawMe(Controller.contexts[Controller.DEFAULT_BLOCK_LAYER_ID]);

            rawB.classList.add(TAG_OF_BLOCK);

            /*end DB code */
            blocks.push({rect: rect, el: rawB, canel: dbBox});
        }

    }
}

/**
 * Loads playerOne, or the player controlled by the keyboard.
 */
function loadPlayer() {
    browser.runtime.sendMessage({"stateinfo": false, "onstateneed": false, "needpimg": true}).then((message) => {
        "use strict";
        playerOne = new Mob(0, 0);
        playerOne.left = blocks[0].rect.left;
        playerOne.top = blocks[0].rect.top - playerOne.height - 1;
        playerOne.img = new Image();
        playerOne.img.setAttribute("src", message.img);
        Controller.SPRITE_SHEET = playerOne.img;
        playerOne.loaded = true;
    }, handErrICons);
}

/**
 * The main loop of the game. NOTE, firstRunCheck should be run first.
 */
function loop() {
    if (on) {
        Controller.timeStamp = (new Date()).getTime();
        if (playerOne != null) {
            updateBackDrop();

            //Draw effects and trash them if done with their cycle.
            let acI = 0;
            Controller.contexts[Controller.DEFAULT_EFFECT_LAYER_ID].clearRect(0, 0, Controller.CANVAS_SIZE.width, Controller.CANVAS_SIZE.height);
            while (Controller.activeEffects[acI] != null) {
                let effect = Controller.activeEffects[acI];
                effect.moveTic();
                if (!effect.isTrash()) {
                    effect.drawMe(Controller.contexts[Controller.DEFAULT_EFFECT_LAYER_ID]);
                } else {
                    Controller.activeEffects.splice(acI, 1);
                }
                acI++;
            }

            //Draw blocks that are flagged with draw-time.
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].canel instanceof Water) {
                    blocks[i].canel.eraseMe(Controller.contexts[Controller.DEFAULT_BLOCK_LAYER_ID]);
                    blocks[i].canel.drawMe(Controller.contexts[Controller.DEFAULT_BLOCK_LAYER_ID]);
                }
            }

            playerOne.eraseMe(Controller.contexts[Controller.DEFAULT_PLAYER_LAYER_ID]);
            if ((playerOne.dx != 0 || playerOne.dy != 0 || !playerOne.onGround)) {
                collisionDetect(playerOne);
                accelerateMoveNeg();
                accelerateMovePos();
                playerOne.moveTic();
            }
            playerOne.drawMe(Controller.contexts[Controller.DEFAULT_PLAYER_LAYER_ID]);
        }

        let timeDelay = Controller.frameSpeed - ((new Date()).getTime() - Controller.timeStamp);
        setTimeout(loop, timeDelay);
    }
}

/**
 * Changes the star pattern, or changes opacity.
 */
//TODO make not redraw every time or test which is faster.
function updateBackDrop() {
    "use strict";
    if (Controller.SPRITE_SHEET != "") {
        let starPos = [[68, 0], [80, 0], [68, 12], [80, 12]];
        if (Star.stars[0] == null || Controller.backdropCounter == Controller.BACKDROP_SKIP_MAX) {
            for (let i = 0; i < 10; i++) {
                if (Star.stars[i] != null) Star.stars[i].draw++;
                let redo = Star.stars[i] == null || Star.stars[i].draw == 3;
                if (redo) {
                    let x = Math.floor(Math.random() * Controller.CANVAS_SIZE.width);
                    let y = Math.floor(Math.random() * Controller.CANVAS_SIZE.height);
                    let star = starPos[Math.floor(Math.random() * starPos.length)];
                    Star.stars[i] = {"x": x, "y": y, "star": star, "draw": 0};
                    // Draw
                    // 0 -> Fade in
                    // 1 -> Stay there
                    // 2 -> Fade out
                    // 3 -> Reassign
                } else {
                    if (Star.stars[i].draw == 2) {
                        Star.stars[i].draw -= Math.floor(Math.random() * 2);
                    }
                }
            }
            Controller.contexts[Controller.DEFAULT_BACKDROP_ID].globalAlpha = 0;
            Controller.backdropCounter = 0;

        } else {
            Controller.contexts[Controller.DEFAULT_BACKDROP_ID].clearRect(0, 0, Controller.CANVAS_SIZE.width, Controller.CANVAS_SIZE.height);
            let sign = Controller.backdropCounter  - Controller.BACKDROP_SKIP_MAX/2 > 0 ? -1 : 1;
            Controller.contexts[Controller.DEFAULT_BACKDROP_ID].globalAlpha += Star.oppac * sign;
            for (let i = 0; i < 10; i++) {
                if ((Star.stars[i].draw == 0 && sign == 1) || (Star.stars[i].draw == 2 && sign == -1)) {
                    Controller.contexts[Controller.DEFAULT_BACKDROP_ID].drawImage(
                        Controller.SPRITE_SHEET, Star.stars[i].star[0], Star.stars[i].star[1], 12, 12, Star.stars[i].x, Star.stars[i].y, 12, 12);
                } else {
                    let ga = Controller.contexts[Controller.DEFAULT_BACKDROP_ID].globalAlpha;
                    Controller.contexts[Controller.DEFAULT_BACKDROP_ID].globalAlpha = 1;
                    Controller.contexts[Controller.DEFAULT_BACKDROP_ID].drawImage(
                        Controller.SPRITE_SHEET, Star.stars[i].star[0], Star.stars[i].star[1], 12, 12, Star.stars[i].x, Star.stars[i].y, 12, 12);
                    Controller.contexts[Controller.DEFAULT_BACKDROP_ID].globalAlpha = ga;
                }
            }
            Controller.backdropCounter++;
        }
    }
}

/**
 * Checks if the mob is colliding with any blocks and tells the block.
 * @param mob The mob in question.
 */
//TODO add blocks as a param
function collisionDetect(mob) {
    //TODO add within collision call for water and other in block detection
    mob.wallSlide = false;
    mob.onGround = false;
    mob.sideHop = 0;
    let bInside = [];
    let mobBox = mob.getCollisionBox();
    for (let i = 0; i < blocks.length; i++) {
        let rec = blocks[i].rect;
        let pWithinX = (within(mobBox.left, mobBox.left + mobBox.width, rec.left) ||
                        within(mobBox.left, mobBox.left + mobBox.width, rec.right) ||
                        within(rec.left, rec.right, mobBox.left));
        let hitG = approxThere((mobBox.height + mobBox.top), rec.top, mob.dy);
        let hitHead = approxThere(mobBox.top, rec.bottom, mob.dy);
        if (mob.dy >= 0 && hitG && pWithinX) {
            blocks[i].canel.handleCollision(mob, SideEnum.top);
        } else if (hitHead && pWithinX) {
            blocks[i].canel.handleCollision(mob, SideEnum.bottom);
        }
        let pWithinY = withinExclusive(rec.top, rec.bottom, mobBox.top + mobBox.height / 2) ||
                        withinExclusive(rec.top, rec.bottom, mobBox.top + mobBox.height) ||
                        withinExclusive(rec.top, rec.bottom, mobBox.top);
        if (pWithinY && (approxThere(mobBox.left + mobBox.width, rec.left, mob.dx) || approxThere(mobBox.left, rec.right, mob.dx))) {
            if (approxThere(mobBox.left + mobBox.width, rec.left, mob.dx)) {
                blocks[i].canel.handleCollision(mob, SideEnum.left);
            } else {
                blocks[i].canel.handleCollision(mob, SideEnum.right);
            }
        }
        if (blocks[i].canel instanceof Water && pWithinX && pWithinY) {
            bInside.push(blocks[i]);
        }
    }
    let smallest = null;
    for (let i = 0; i < bInside.length; i++) {
        if (smallest == null || bInside[i].canel.getArea() < smallest.canel.getArea()) {
            smallest = bInside[i];
        }
    }
    if (smallest == null) {
        if (mob.blockIn != null) {
            mob.blockIn.handleCollision(mob, SideEnum.goingOut);
            Block.hitIn(mob);
        }
        Block.hitWithin(mob, SideEnum.within);
        mob.blockIn = null;
    } else {
        // Change the block that player is in(smallest).
        if (mob.blockIn != smallest.canel) {
            if (mob.blockIn != null)
                mob.blockIn.handleCollision(mob, SideEnum.goingOut);
            smallest.canel.handleCollision(mob, SideEnum.goingIn);
            mob.blockIn = smallest.canel;
        }
        smallest.canel.handleCollision(mob, SideEnum.within);
    }
}

/**
 * Use to change the player's movement with keys.
 * @param input
 */
function keyToMovement(input) {
    switch (input.keyCode) {
        case 68:
            if (playerOne.sideHop < 0 && playerOne.dy != 0) {
                playerOne.dx = playerOne.movementSpeed;
                playerOne.sideHop = 0;
                playerOne.dy = Mob.JUMP_HEIGHT;
                playerOne.wallSlide = false;
            } else {
                if (playerOne.dx <= 0) {
                    playerOne.dx = Mob.MOVEMENT_ACCELERATION;
                }
            }
            break;
        case 65:
            if (playerOne.sideHop > 0 && playerOne.dy != 0) {
                playerOne.dx = playerOne.movementSpeed * -1;
                playerOne.sideHop = 0;
                playerOne.dy = Mob.JUMP_HEIGHT;
                playerOne.wallSlide = false;
            } else {
                if (playerOne.dx >= 0) {
                    playerOne.dx = Mob.MOVEMENT_ACCELERATION * -1;
                }
            }
            break;
        case 87:
            if (playerOne.onGround || playerOne.playerDD >= 1) {
                playerOne.dy = Mob.JUMP_HEIGHT;
                playerOne.playerDD--;
                playerOne.onGround = false;
            }
            break;
        case 83:
            break;
        case 220:
            on = false;
            break;
        case 221:
            on = true;
            break;
        case 74:
            if (playerOne.dx == 0 && playerOne.dy == 0) {
                Controller.activeEffects.push(new Bullet(playerOne, SideEnum.left));
                playerOne.currAnimation = Animations.SHOOT_LEFT;
                playerOne.newMation = true;
            }
            break;
        case 76:
            if (playerOne.onGround && playerOne.dx == 0 && playerOne.dy == 0) {
                Controller.activeEffects.push(new Bullet(playerOne, SideEnum.right));
                playerOne.currAnimation = Animations.SHOOT_RIGHT;
                playerOne.newMation = true;
            }
            break;
    }
}

/**
 * Accelerates player in Positive direction.
 */
// TODO move to player class.
function accelerateMovePos() {
    "use strict";
    if (playerOne.dx != 0) {
        if (playerOne.dx >= playerOne.movementSpeed) {
            playerOne.dx = playerOne.movementSpeed;
        } else if (playerOne.dx > 0) {
            playerOne.dx += Mob.MOVEMENT_ACCELERATION;
        }
    }
}

/**
 * Accelerates player in Negative direction.
 */
// TODO move to player class.
function accelerateMoveNeg() {
    "use strict";
    if (playerOne.dx != 0) {
        if (playerOne.dx <= (playerOne.movementSpeed * -1)) {
            playerOne.dx = playerOne.movementSpeed * -1;
        } else if (playerOne.dx < 0) {
            playerOne.dx -= Mob.MOVEMENT_ACCELERATION;
        }
    }
}

/** deprecated */
function createBlockIdentity(x, y, width, height) {
    let dbBox = document.createElement("div");
    dbBox.classList.add(BLOCK_1_C_NAME); // Adds the style
    dbBox.style.left = x + "px";
    dbBox.style.top = y + "px";
    dbBox.style.width = width + "px";
    dbBox.style.height = height + "px";
    dbBox.classList.add(TAG_OF_BLOCK); // Adds the tagging so to not reload it as page el
    return dbBox;
}

/**
 * Use to change stop axis movement with keys.
 * @param input
 */
function keyToStop(input) {
    playerOne.newMation = true;
    switch (input.keyCode) {
        case 68:
            if (playerOne.dx >= 0) {
                playerOne.dx = 0;
            }
            break;
        case 65:
            if (playerOne.dx <= 0) {
                playerOne.dx = 0;
            }
            break;
        case 83:
    }
}

/**
 * Checks if given two bounds, if the point is within them.
 * @param boundI {Number}
 * @param boundII {Number}
 * @param point {Number}
 * @returns {boolean}
 */
function within(boundI, boundII, point) {
    let iG = boundI > boundII;
    let greater = iG ? boundI : boundII;
    let lesser = iG ? boundII : boundI;

    return point >= lesser && point <= greater;
}

/**
 * Checks if given two bounds, if the point is within it but not equal to them.
 * @param boundI {Number}
 * @param boundII {Number}
 * @param point {Number}
 * @returns {boolean}
 */
function withinExclusive(boundI, boundII, point) {
    let iG = boundI > boundII;
    let greater = iG ? boundI : boundII;
    let lesser = iG ? boundII : boundI;
    return point > lesser && point < greater;
}

/**
 * Checks if i is within a rage of ii.
 * @param i {Number}
 * @param ii {Number}
 * @param approx {Number}
 * @returns {boolean} True is if
 */
function approxThere(i, ii, approx) {
    if (i == ii) return true;
    let iG = i > ii;
    let greater = iG ? i : ii;
    let lesser = iG ? ii : i;
    return greater - lesser <= Math.abs(approx);
}
