/*
 * Purpose: To start necessary jobs.
 * Jobs:
 *  - loadassets
 */
browser.runtime.onMessage.addListener(topSortMessage);

function Notter() {
    "use strict";

}

Notter.on = false;
Notter.pImg = browser.extension.getURL("assets/spacemun.png");

console.log("Loaded Back\n");
browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.executeScript({
        file: "client_jobs/loadassets.js"
    });
});

function topSortMessage(request, sender, sendResponse) {
    console.log("Need info?\n");
    if (request.stateinfo) {
        console.log("Set on state in top to " + request.state + "\n");
        Notter.on = request.state;
    }
    if (request.onstateneed) {
        console.log("Sending from top: " + Notter.on + "\n");
        sendResponse({"stateinfo": true, "state": Notter.on});
    } else if (request.needpimg) {
        console.log("Sending player img from top" + Notter.pImg + "\n");
        sendResponse({"pimg": true, "img": Notter.pImg})
    }
}