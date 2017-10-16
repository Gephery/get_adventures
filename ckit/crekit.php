
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CreKit</title>
    <link href="crecss.css" type="text/css" rel="stylesheet" />
    <script rel="script" type="application/javascript" src="crekit.js"></script>
</head>
<body>
    <div id="crediv">
        <div id="leftcan">
            <div class="options" id="options">
                <div class="optcla">
                    <input id="square" type="button" value="[]">
                    <input id="triangle" type="button" value="/\">
                    <input id="circle" type="button" value="o">
                </div>
                <div class="optcla">
                    <input id="export" type="button" value="Export">
                    <input id="import" type="button" value="Import">
                    <label>Json: <textarea id="jtext" class="incl"></textarea></label>
                </div>
            </div>
        </div>
        <div id="centercan"><canvas id="crecan" width="600" height="500"></canvas></div>
        <div id="rightcan"></div>
    </div>
    <div class="options" hidden="hidden">
        <div class="optcla">
            Coordinates: (<p id="x">0</p>, <p id="y">0</p>)
            Scale: <p id="scale">1</p>
        </div>
        <div class="optcla"><label>UUID: <input id="uuidr" type="number" value="1"></label></div>
        <div class="optcla"><label>Layer: <input id="layer" type="number" value="0"></label></div>
        <div class="optcla"><label>Size: <input id="size" type="number" value="20"></label></div>
        <div class="optcla"><label>Theta: <input id="theta" type="number" value="0"></label></div>
        <div class="optcla"><label>Theta End: <input id="thetae" type="number" value="360"></label></div>
        <div class="optcla"><input id="erase" type="button" value="Erase"></div>
    </div>
</body>
</html>