/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';

class DelayedClickEventHandler {
    constructor() {
        this._triggerDelayedClickEvent = false;
        this._addEventListeners();
    }

    _addEventListeners() {
        if(global.deviceType != "XR") {
            this._eventType = global.deviceType == "MOBILE"
                ? 'touchend'
                : 'click';
            this._clickListener = () => {
                setTimeout(() => {
                    if(this._triggerDelayedClickEvent) {
                        this._triggerDelayedClickEvent = false;
                        if(this._callback) this._callback();
                    }
                }, 20);
            };
            //Why this convoluted chain of event listener checking a variable
            //set by interactable action (which uses polling)? Because we can't
            //trigger a popup with a click event outside of an event listener on
            //Safari :(
        }
    }

    triggerEvent() {
        this._triggerDelayedClickEvent = true;
    }

    listenForClick(callback) {
        this._callback = callback;
        document.addEventListener(this._eventType, this._clickListener);
    }

    stopListening() {
        this._callback = null;
        this._fileListenerActive = false;
        document.removeEventListener(this._eventType, this._clickListener);
    }

}

let delayedClickEventHandler = new DelayedClickEventHandler();
export default delayedClickEventHandler;
