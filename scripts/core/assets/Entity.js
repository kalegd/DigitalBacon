/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { uuidv4, fullDispose } from '../../../scripts/core/helpers/utils.module.js';
import { Object3D } from 'three';

export default class Entity {
    constructor() {
        this._id = uuidv4();
        this._object = new Object3D();
    }
    
    getId() {
        return this._id;
    }

    getObject() {
        return this._object;
    }

    addToScene(scene) {
        if(scene) {
            scene.add(this._object);
        }
    }

    removeFromScene() {
        if(this._object.parent) { 
            this._object.parent.remove(this._object);
            fullDispose(this._object);
        }
    }
}
