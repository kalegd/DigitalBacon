/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';

class ClickAction {
    constructor(action) {
        this._action = action;
        this._triggerAction = false;
        this._addEventListeners();
    }

    _addEventListeners() {
        if(global.deviceType != "XR") {
            this._eventType = global.deviceType == "MOBILE"
                ? 'touchend'
                : 'click';
            this._clickListener = () => {
                setTimeout(() => {
                    if(this._triggerAction) {
                        this._triggerAction = false;
                        if(this._action) this._action();
                    }
                }, 20);
            };
            //Why this convoluted chain of event listener checking a variable
            //set by interactable action (which uses polling)? Because we can't
            //trigger the file input with a click event outside of an event
            //listener on Firefox and Safari :(
        }
    }


    listen() {
        document.addEventListener(this._eventType, this._clickListener);
    }

    triggerAction() {
        if(global.deviceType == 'XR') {
            if(this._action) this._action();
        } else {
            this._triggerAction = true;
        }
    }

    stopListening() {
        document.removeEventListener(this._eventType, this._clickListener);
    }

}

export default ClickAction;
