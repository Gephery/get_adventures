/**
 * Created by gephery on 3/21/17.
 */
// Use eval take in input and display that
"use strict";
(function () {
    //TODO add shape attributes for collision detection and maybe make so either global or local
    let UUIDCounter = 1; //TODO add cleaning function for model
    // TODO start on model scene switching and engine filters(e.g. collision and gravity) 
    let editorMode = null;

    const gridDotSize = 12;
    const GRID_MODE = 0;

    let selectedShape;
    let model;

    let outLines = [];
    let canvas;
    let ctx;
    let windowSizer;

    window.onload = function () {
        canvas = document.getElementById("crecan");
        ctx = canvas.getContext("2d");

        document.getElementById("square").addEventListener("click", function(e) {
            addShape(e, Types.square , ctx);
        });
        document.getElementById("triangle").addEventListener("click", function(e) {
            addShape(e, Types.triangle, ctx);
        });
        document.getElementById("circle").addEventListener("click", function(e) {
            addShape(e, Types.circle, ctx);
        });

        document.getElementById("erase").onclick = erase;
        document.getElementById("export").onclick = shapeJson;
        document.getElementById("import").onclick = importShapes;
        canvas.addEventListener("dblclick", outLineShapes);
        canvas.addEventListener("click", selectShapeMouse);

        model = new Model();
        model.left = canvas.width / 2;
        model.top = canvas.height / 2;
        windowSizer = canvas.getBoundingClientRect();

        editorMode = setInterval(update, 1000/30);
    };

    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        for (let i = 0; i < outLines.length; i++) {
            if (outLines[i])
                outLines[i].draw(ctx, model.left, model.top); //TODO not right way to do this add model method for it
        }
        model.drawScene("temp", ctx);
        if (selectedShape != null && selectedShape != 0) {

            document.getElementById("x").innerText = String(selectedShape.left);
            document.getElementById("y").innerText = String(selectedShape.top);

            // Draw center dot
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(selectedShape.left + model.left, selectedShape.top + model.top, 4, 0, 2 * Math.PI, true);
            ctx.closePath();
            ctx.fill();

        }
    }

    function outLineShapes() {
        let shapes = model.getShapes("temp");
        if (outLines.length == 0) {
            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i] != null) {
                    for (let j = 0; j < shapes[i].length; j++) {
                        if (shapes[i][j]) {
                            let shape = shapes[i][j];
                            outLines.push(new Shape(shape.left, shape.top, 0,
                                shape.thetaEnd, Types.square, 0, shape.size,
                                "red", "red"));
                        }
                    }
                }
            }
        } else {
            outLines = [];
        }
    }

    function selectShapeMouse(e) {
        // Undo the selection of the old shape and change color back
        deselectShape();

        let x = e.clientX - windowSizer.left;
        let y = e.clientY - windowSizer.top;
        let gridPosX = model.left - gridDotSize / 2;
        let gridPosY = model.top - gridDotSize / 2;
        let layer = Number(document.getElementById("layer").value);
        let shapToFind = model.getShapes("temp")[layer];
        if (x >= gridPosX && x <= gridPosX + gridDotSize) {
            if (y >= gridPosY && y <= gridPosY + gridDotSize) {
                window.addEventListener('keydown', moveGrid);
                window.addEventListener('keyup', stopGrid);
                selectedShape = GRID_MODE;
            }
        } else if (shapToFind) {
            for (let i = 0; i < shapToFind.length; i++) {
                let shape = shapToFind[i];
                if (shape) {
                    let gSSX = shape.left + model.left;
                    let gSSY = shape.top + model.top;
                    let sx = gSSX + shape.size;
                    let sy = gSSY + shape.size;
                    if (x >= gSSX && x <= sx) {
                        if (y >= gSSY && y <= sy) {
                            selectShape(shape);
                            break;
                        }
                    }
                }
            }
        }
    }

    function deselectShape() {
        if (selectedShape != null) {
            if (selectedShape != GRID_MODE) {
                selectedShape.fillColor = "black";
            }
            selectedShape = null;
            window.removeEventListener('keydown', moveShape);
            window.removeEventListener('keyup', stopShape);
            window.removeEventListener('keydown', moveGrid);
            window.removeEventListener('keydown', stopGrid);
            document.getElementById("size").onchange = null;
            document.getElementById("theta").onchange = null;
            document.getElementById("thetae").onchange = null;
            document.getElementById("layer").onchange = null;
            document.getElementById("uuidr").onchange = null;
        }
    }

    function selectShape(shape) {
        selectedShape = shape;
        // Add moveability and color
        window.addEventListener('keydown', moveShape);
        window.addEventListener('keyup', stopShape);
        let sizer = document.getElementById("size");
        sizer.onchange = editShapeProperties;
        sizer.value = shape.size;
        let theta = document.getElementById("theta");
        theta.onchange = editShapeProperties;
        theta.value = shape.thetaStart * 180 / Math.PI;
        let thetaEnd = document.getElementById("thetae");
        thetaEnd.onchange = editShapeProperties;
        thetaEnd.value = shape.thetaEnd * 180 / Math.PI;
        let uuid = document.getElementById("uuidr");
        uuid.onchange = editShapeProperties;
        uuid.value = shape.uuid;
        let layerR = document.getElementById("layer");
        layerR.onchange = editShapeProperties;
        shape.fillColor = "gray";
    }

    function erase() {
        if (selectedShape != null && selectedShape != GRID_MODE) {
            model.removeShape("temp", selectedShape);
            selectedShape.fillColor = "black";
            selectedShape = null;
            window.removeEventListener('keydown', moveShape);
            window.removeEventListener('keyup', stopShape);
            document.getElementById("size").onchange = null;
            document.getElementById("theta").onchange = null;
            document.getElementById("thetae").onchange = null;
            document.getElementById("layer").onchange = null;
        }
    }

    function editShapeProperties(e) {
        let size = Number(document.getElementById("size").value);
        size = size > 0 ? size : 15;
        let theta = document.getElementById("theta").value * Math.PI / 180;
        let thetaEnd = document.getElementById("thetae").value * Math.PI / 180;
        let layer = Number(document.getElementById("layer").value);
        let uuid = Number(document.getElementById("uuidr").value);

        model.changeShapeLayer(selectedShape, "temp", layer);

        selectedShape.size = size;
        selectedShape.thetaStart = theta;
        selectedShape.thetaEnd = thetaEnd;
        selectedShape.uuid = uuid;
    }

    function moveGrid(e) {
        switch(e.keyCode) {
            case 87:
                model.dy = -1;
                break;
            case 83:
                model.dy = 1;
                break;
            case 65:
                model.dx = -1;
                break;
            case 68:
                model.dx = 1;
                break;
            case 90:
                model.dScale = 1;
                break;
            case 88:
                model.dScale = -1;
                break;
        }
    }

    function stopGrid(e) {
        switch(e.keyCode) {
            case 87:
                model.dy = 0;
                break;
            case 83:
                model.dy = 0;
                break;
            case 65:
                model.dx = 0;
                break;
            case 68:
                model.dx = 0;
                break;
            case 90:
                model.dScale = 0;
                break;
            case 88:
                model.dScale = 0;
                break;
        }
    }

    function moveShape(e) {
        switch(e.keyCode) {
            case 87:
                selectedShape.dy = -1;
                break;
            case 83:
                selectedShape.dy = 1;
                break;
            case 65:
                selectedShape.dx = -1;
                break;
            case 68:
                selectedShape.dx = 1;
                break;
            case 90:
                selectedShape.dTheta = 2 * Math.PI / 180;
                break;
            case 88:
                selectedShape.dTheta = -2 * Math.PI / 180;
                break;
        }
    }

    function stopShape(e) {
        switch(e.keyCode) {
            case 87:
                selectedShape.dy = 0;
                break;
            case 83:
                selectedShape.dy = 0;
                break;
            case 65:
                selectedShape.dx = 0;
                break;
            case 68:
                selectedShape.dx = 0;
                break;
            case 90:
                selectedShape.dTheta = 0;
                break;
            case 88:
                selectedShape.dTheta = 0;
                break;
        }
    }

    function addShape(e, type) {
        deselectShape();
        let size = Number(document.getElementById("size").value);
        size = size > 0 ? size : 15;

        let theta = document.getElementById("theta").value * Math.PI / 180;
        let thetaEnd = document.getElementById("thetae").value * Math.PI / 180;

        let layer = Number(document.getElementById("layer").value);

        let ns = model.addShape("temp", size, 0, 0, theta, thetaEnd, layer, type, UUIDCounter);
        UUIDCounter++;
        document.getElementById("uuidr").value = UUIDCounter;
        selectShape(ns);
    }

    function drawGrid() {

        // Draw center dot
        model.updateScale();
        ctx.fillStyle = 'gray';
        ctx.strokeStyle = 'gray';
        if (selectedShape == GRID_MODE) {
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'red';
            model.left += model.dx;
            model.top += model.dy;
        }
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(model.left, model.top, 6, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();

        // X axis
        ctx.beginPath();
        ctx.moveTo(0, model.top);
        ctx.lineTo(canvas.width, model.top);
        ctx.closePath();
        ctx.stroke();

        // Y axis
        ctx.beginPath();
        ctx.moveTo(model.left, 0);
        ctx.lineTo(model.left, canvas.height);
        ctx.closePath();
        ctx.stroke();
    }

    function shapeJson() {
        let shapes = model.getShapes("temp");
        // TODO add cleaing function for model
        let el = document.getElementById("jtext");
        el.disabled = "";
        el.value = JSON.stringify({"shapes": shapes, "xn": model.left, "yn": model.top});
    }

    function importShapes() {
        //TODO add model function that should do majority of this
        model.loadFromJSON(document.getElementById("jtext").value);
    }

    class Shape {
        constructor(x, y, thetaStart, thetaEnd, type, UUID, size, layer, strokeColor='green',
                    fillColor="black", finalX=null, finalY=null, finalTheta=null,
                    lineWidth="2") {
            this.size = size;
            this.left = x;
            this.top = y;
            this.dx = 0;
            this.dy = 0;
            this.dTheta = 0; // Degrees
            this.thetaStart = thetaStart;
            this.thetaEnd = thetaEnd;
            this.type = type;
            this.strokeColor = strokeColor;
            this.fillColor = fillColor;
            this.lineWidth = lineWidth;
            this.uuid = UUID;
            this.layer = layer;
            this.finalX = finalX;
            this.finalY = finalY;
            this.finalTheta = finalTheta;
        }


        draw(ctx, x, y, thetaAdd=0) {
            let modSize = this.size;
            this.left += this.dx;
            this.top += this.dy;
            this.thetaStart += this.dTheta + thetaAdd;
            ctx.fillStyle = this.fillColor;
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.lineWidth;
            ctx.translate(x + this.left, y + this.top);
            if (this.type == Types.triangle || this.type == Types.square)
                ctx.rotate(this.thetaStart);
            ctx.beginPath();
            if (this.type == Types.triangle) {
                ctx.moveTo(0, 0);
                ctx.lineTo(0, modSize);
                ctx.lineTo(modSize, modSize);
                ctx.lineTo(0, 0);
            } else if (this.type == Types.square) {
                ctx.rect(0, 0, modSize, modSize)
            } else {
                ctx.translate(modSize / 2, modSize / 2);
                ctx.arc(0, 0,modSize / 2, this.thetaStart, this.thetaEnd);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.rotate(-this.thetaStart);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    class Model {
        constructor(json="", scene="temp") {
            this.left = 0;
            this.top = 0;
            this.dy = 0;
            this.dx = 0;
            this.scenes = {};
            this.scenes.temp = [];
            this.dTheta = 0;
            this.loadFromJSON(json, scene);
        }

        loadFromJSON(json, scene) {
            if (json) {
                let mod = JSON.parse(json);
                if (mod != null) {
                    let tShapes = mod.shapes;
                    let shapes = this.getShapes(scene);
                    for (let i = 0; i < tShapes.length; i++) {
                        if (tShapes[i] && tShapes[i].length > 0) {
                            for (let j = 0; j < tShapes[i].length; j++) {
                                if (tShapes[i][j]) {
                                    let shape = tShapes[i][j];
                                    if (!shapes[i])
                                        shapes[i] = [];
                                    this.addShape("temp", shape.size, shape.left, shape.top,
                                        shape.thetaStart, shape.thetaEnd, shape.layer,
                                        shape.type, shape.uuid, shape.strokeColor,
                                        shape.fillColor);
                                }
                            }
                        }
                    }
                    this.left = mod.xn;
                    this.top = mod.yn;
                }
                let tShapes = mod.shapes;
                let shapes = this.getShapes(scene);
                for (let i = 0; i < tShapes.length; i++) {
                    if (tShapes[i] && tShapes[i].length > 0) {
                        for (let j = 0; j < tShapes[i].length; j++) {
                            if (tShapes[i][j]) {
                                let shape = tShapes[i][j];
                                if (!shapes[i])
                                    shapes[i] = [];
                                this.addShape("temp", shape.size, shape.left, shape.top,
                                    shape.thetaStart, shape.thetaEnd, shape.layer,
                                    shape.type, shape.uuid, shape.strokeColor,
                                    shape.fillColor);
                            }
                        }
                    }
                }
            }
        }

        updateScale() {
            if (this.scale <= 0) {
                this.dScale = 0;
                this.scale = 1;
            } else {
                this.scale += this.dScale;
            }
        }

        addShape(scene, size, x, y, theta, thetaEnd, layer, type, uuid, strokeColor="green", fillColor="black") {
            let ns;
            if (type == Types.triangle) {
                ns = new Shape(x, y, theta, 0, Types.triangle, uuid, size, layer, strokeColor, fillColor);
            } else if (type == Types.square) {
                ns = new Shape(x, y, theta, 0, Types.square, uuid, size, layer, strokeColor, fillColor);
            } else {
                ns = new Shape(x, y, theta, thetaEnd, Types.circle, uuid, size, layer, strokeColor, fillColor);
            }
            if (this.scenes[scene] == null) {
                this.scenes[scene] = [];
            }
            if (this.scenes[scene][layer] == null) {
                this.scenes[scene][layer] = [];
            }
            this.scenes[scene][layer][uuid] = ns;
            return ns;
        }

        getShapes(scene) {
            if (!this.scenes[scene])
                this.scenes[scene] = [];
            return this.scenes[scene];
        }

        drawScene(scene, ctx) {
            let shapes = this.scenes[scene];
            for (let layer = 0; layer < shapes.length; layer++) {
                if (shapes[layer] != null) {
                    for (let j = 0; j < shapes[layer].length; j++) {
                        if (shapes[layer][j])
                            shapes[layer][j].draw(ctx, this.left, this.top, this.dTheta);
                    }
                }
            }
        }

        removeShape(scene, shape) {
            this.scenes[scene][shape.layer][shape.uuid] = null;
        }

        getShape(scene, layer, uuid) {
            return this.scenes[scene][layer][uuid];
        }

        changeShapeLayer(shape, scene, layer) {
            let shapes = this.scenes[scene];
            shapes[shape.layer][shape.uuid] = null;
            if (!shapes[layer])
                shapes[layer] = [];
            shapes[layer][shape.uuid] = shape;
        }
    }


    let Types = {"triangle": 0, "square": 1, "circle": 2};

})();
