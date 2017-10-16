/**
 * Created by gephery on 9/7/17.
 */

"use strict";
browser.runtime.sendMessage({"stateinfo": false, "onstateneed": true}).then(handMessageCon, handErrICons);
