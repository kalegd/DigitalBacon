/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import * as THREE from 'three';

class AudioHandler {
    init() {
        if(this._audioListener) return;

        this._audioListener = new THREE.AudioListener();
        this._addEventListeners();
        global.camera.add(this._audioListener);
    }

    _addEventListeners() {
        //XR Event Listeners
        global.renderer.xr.addEventListener("sessionstart", () => {
            this._audioListener.context.resume();
        });
        global.renderer.xr.addEventListener("sessionend", () => {
            this._audioListener.context.suspend();
        });
    }

}

let audioHandler = new AudioHandler();
export default audioHandler;
