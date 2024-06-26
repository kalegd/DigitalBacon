/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { CubeTexture, SRGBColorSpace } from 'three';

const RESOLUTION = 1024;
const SIDES = [];
for(let _ in CubeSides) {
    let canvas = document.createElement('canvas');
    canvas.width = RESOLUTION;
    canvas.height = RESOLUTION;
    SIDES.push({
        canvas: canvas,
        context: canvas.getContext("2d"),
    });
}

class Skybox {
    constructor() {
        this._id = uuidv4();
        this._isAR = false;
        PubSub.subscribe(this._id, PubSubTopics.SESSION_STARTED, () => {
            this._isAR = global.xrSessionType == 'AR';
            if(this._isAR) this._scene.background = null;
        });
        PubSub.subscribe(this._id, PubSubTopics.SESSION_ENDED, () => {
            this._isAR = false;
            this._scene.background = this._background;
        });
    }
    init(scene) {
        this._scene = scene;
        this._background = new CubeTexture([
            SIDES[CubeSides.RIGHT].canvas,
            SIDES[CubeSides.LEFT].canvas,
            SIDES[CubeSides.TOP].canvas,
            SIDES[CubeSides.BOTTOM].canvas,
            SIDES[CubeSides.FRONT].canvas,
            SIDES[CubeSides.BACK].canvas,
        ]);
        this._background.colorSpace = SRGBColorSpace;
        if(!this._isAR) this._scene.background = this._background;
    }

    setSides(assetIds) {
        for(let side in assetIds) {
            this.setSide(side, assetIds[side]);
        }
    }

    setSide(side, assetId) {
        let image = (assetId)
            ? LibraryHandler.getImage(assetId)
            : null;
        this._drawImage(side, image);
        this._background.needsUpdate = true;
    }

    deleteSide(side) {
        this._drawImage(side);
        this._background.needsUpdate = true;
    }

    //https://stackoverflow.com/a/23105310
    _drawImage(side, image) {
        let canvas = SIDES[side]['canvas'];
        let context = SIDES[side]['context'];
        context.clearRect(0, 0, canvas.width, canvas.height);
        if(!image) return;
        let ratio  = RESOLUTION / Math.max(image.width, image.height);
        let centerShift_x = (canvas.width - image.width*ratio) / 2;
        let centerShift_y = (canvas.height - image.height*ratio) / 2;
        context.drawImage(image, 0, 0, image.width, image.height, centerShift_x,
            centerShift_y, image.width * ratio, image.height * ratio);
    }
}

let skybox = new Skybox();
export default skybox;
