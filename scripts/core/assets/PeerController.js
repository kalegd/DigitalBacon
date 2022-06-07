/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import Entity from '/scripts/core/assets/Entity.js';
import UserMessageCodes from '/scripts/core/enums/UserMessageCodes.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

export default class PeerController extends Entity {
    constructor(avatarUrl) {
        super();
        this._velocity = new THREE.Vector3();
        this._setup(avatarUrl);
    }

    _setup(avatarUrl) {
        this._avatar = new Avatar({
            'URL': avatarUrl,
            'Vertical Offset': 1.7,
        });
    }

    _updateAvatarData(float32Array, index) {
        let object = this._avatar.getObject();
        object.position.fromArray(float32Array, index);
        let rotation = float32Array.slice(index + 3, index + 6);
        object.rotation.fromArray(rotation);
    }

    _updateVelocity(float32Array, index, isXR, timeDelta) {
        this._velocity.fromArray(float32Array, index);
        this._object.position.addScaledVector(this._velocity, timeDelta);
        if(!isXR) {
            vector3s[0].copy(this._velocity).setY(0);
            if(vector3s[0].length() < 0.001) return;
            vector3s[0].multiplyScalar(-1).add(this._object.position);
            this._object.lookAt(vector3s[0]);
        }
    }

    _updatePosition(float32Array, index) {
        //TODO: Don't jump to the correct position, track the error and reduce
        //      it over the next few calls
        this._object.position.fromArray(float32Array, index);
    }

    updateAvatar(url) {
        this._avatar.updateSourceUrl(url);
    }

    addToScene(scene) {
        super.addToScene(scene);
        this._avatar.addToScene(this._object);
    }

    removeFromScene() {
        super.removeFromScene();
        this._avatar.removeFromScene();
    }

    update(timeDelta, message) {
        if(message) {
            this._updateWithMessage(timeDelta, message);
        } else {
            this._updateWithoutMessage(timeDelta);
        }
    }

    _updateWithMessage(timeDelta, message) {
        let codes = new Uint8Array(message, 2, 3)[0];
        let float32Array = new Float32Array(message.slice(3));
        let index = 0;
        let isXR = false;
        if(UserMessageCodes.AVATAR & codes) {
            this._updateAvatarData(float32Array, index);
            index += 6;
        }
        if(UserMessageCodes.USER_VELOCITY & codes) {
            this._updateVelocity(float32Array, index, isXR, timeDelta);
            index += 3;
        }
        if(UserMessageCodes.USER_POSITION & codes) {
            this._updatePosition(float32Array, index);
            index += 3;
        }
    }

    _updateWithoutMessage(timeDelta, message) {
        this._object.position.addScaledVector(this._velocity, timeDelta);
    }
}
