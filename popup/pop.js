/**
 * Created by gephery on 9/16/17.
 */
(function() {
    "use strict";

    document.getElementById("gameonbutt").addEventListener("click", sendState);
    browser.runtime.getBackgroundPage().then(setParPop, handErrIPop);

    /**
     * Sends current tab and the background the state of the on button.
     * @param el {HTMLElement} The on button.
     */
    function sendState(el) {
        // Send info to tabs
        browser.tabs.query({
            currentWindow: true,
            active: true
        }).then(_sendState, handErrIPop);

        // Send into to top side
        browser.runtime.sendMessage({"stateinfo": true, "state": document.getElementById("gameonbutt").checked});
    }

    /**
     * "private" function used by sendState for sending on state to current tab.
     * @param tabs
     * @private
     */
    function _sendState(tabs) {
        for (let tab of tabs) {
            if (tab != null) {
                browser.tabs.sendMessage(
                    tab.id,
                    {"stateinfo": true, "state": document.getElementById("gameonbutt").checked}
                );
            }
        }
    }

    /**
     * Sets the on button state on load of pop up.
     * @param page
     */
    function setParPop(page) {
        console.log("Set pop state to " + page.Notter.on + "\n");
        document.getElementById("gameonbutt").checked = page.Notter.on;
    }

    /**
     * General error handling function.
     * @param err
     */
    function handErrIPop(err) {
        console.log("!!Err!! " + err + "\n");
    }
})();
