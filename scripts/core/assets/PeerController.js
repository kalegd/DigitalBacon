/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import Entity from '/scripts/core/assets/Entity.js';
import UserMessageCodes from '/scripts/core/enums/UserMessageCodes.js';
import { vector3s, Fonts } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import * as THREE from 'three';

const ERROR_FIX_FRAMES = 30;
const ERROR_FACTOR = 1 / ERROR_FIX_FRAMES;

export default class PeerController extends Entity {
    constructor(avatarUrl, username, displayingUsername) {
        super();
        this._velocity = new THREE.Vector3();
        this._positionError = new THREE.Vector3();
        this._errorFixFrame = ERROR_FIX_FRAMES;
        this._username = username || '...';
        this._displayingUsername = displayingUsername;
        this._setup(avatarUrl);
    }

    _setup(avatarUrl) {
        this._avatar = new Avatar({
            'URL': avatarUrl,
            'Vertical Offset': 1.7,
        });
        let usernameParams = {
            'text': this._username, 
            'fontFamily': Fonts.defaultFamily,
            'fontTexture': Fonts.defaultTexture,
            'fontSize': 0.06,
            'height': 0.04,
            'width': 0.5,
            'offset': 0,
            'margin': 0,
        };
        this._usernameBlock = new THREE.Object3D();
        let usernameFront = ThreeMeshUIHelper.createTextBlock(usernameParams);
        let usernameBack = ThreeMeshUIHelper.createTextBlock(usernameParams);
        usernameFront.rotateY(Math.PI);
        this._usernameBlock.position.setY(1.85);
        this._usernameBlock.add(usernameFront);
        this._usernameBlock.add(usernameBack);
        if(this._displayingUsername) {
            this._object.add(this._usernameBlock);
        }
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
        this._positionError.fromArray(float32Array, index)
            .sub(this._object.position)
        this._errorFixFrame = 0;
    }

    updateAvatar(url) {
        this._avatar.updateSourceUrl(url);
    }

    setDisplayingUsername(displayingUsername) {
        if(this._displayingUsername == displayingUsername) return;
        this._displayingUsername = !this._displayingUsername;
        if(this._displayingUsername) {
            this._object.add(this._usernameBlock);
        } else {
            this._object.remove(this._usernameBlock);
        }
    }

    updateUsername(username) {
        if(this._username == username) return;
        this._username = username;
        let shortName = username = stringWithMaxLength(username || '...', 17);
        this._usernameBlock.children.forEach((block) => {
            block.children[1].set({ content: shortName });
        });
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
        if(this._errorFixFrame < ERROR_FIX_FRAMES) {
            this._object.position.addScaledVector(this._positionError,
                ERROR_FACTOR);
            this._errorFixFrame++;
        }
    }

    _updateWithMessage(timeDelta, message) {
        let codes = new Uint8Array(message.slice(2, 3))[0];
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
        } else {
            this._velocity.set(0, 0, 0);
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
