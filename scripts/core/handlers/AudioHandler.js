/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '../../../scripts/core/global.js';
import * as THREE from 'three';

class AudioHandler {
    init() {
        if(this._audioListener) return;
        this._audioListener = new THREE.AudioListener();
        global.camera.add(this._audioListener);
    }

    getListener() {
        return this._audioListener;
    }

    setListenerParent(listenerParent) {
        listenerParent.add(this._audioListener);
    }

    resume() {
        this._audioListener.context.resume();
    }

    suspend() {
        this._audioListener.context.suspend();
    }
}

let audioHandler = new AudioHandler();
export default audioHandler;
