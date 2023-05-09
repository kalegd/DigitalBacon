/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import Entity from '/scripts/core/assets/Entity.js';
import PeerHand from '/scripts/core/assets/PeerHand.js';
import Hands from '/scripts/core/enums/Hands.js';
import UserMessageCodes from '/scripts/core/enums/UserMessageCodes.js';
import { vector3s, Fonts } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import * as THREE from 'three';

const ERROR_FIX_FRAMES = 30;
const ERROR_FACTOR = 1 / ERROR_FIX_FRAMES;

export default class PeerController extends Entity {
    constructor(username, displayingUsername) {
        super();
        this._velocity = new THREE.Vector3();
        this._positionError = new THREE.Vector3();
        this._errorFixFrame = ERROR_FIX_FRAMES;
        this._username = username || '...';
        this._displayingUsername = displayingUsername;
        this._setup();
    }

    _setup(avatarUrl) {
        this._avatar = new Avatar({ 'Vertical Offset': 1.7 });
        this._avatar.addToScene(this._object);
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

    _updateHandData(float32Array, index, hand) {
        if(!this.hands) return;
        let peerHand = this.hands[hand].getObject();
        peerHand.position.fromArray(float32Array, index);
        let rotation = float32Array.slice(index + 3, index + 6);
        peerHand.rotation.fromArray(rotation);
    }

    _updateVelocity(float32Array, index, timeDelta) {
        this._velocity.fromArray(float32Array, index);
        this._object.position.addScaledVector(this._velocity, timeDelta);
        if(!this._isXR) {
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

    getAvatar() {
        return this._avatar;
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

    configureAsXR() {
        if(this._isXR) return;
        this._isXR = true;
        this._avatar.setVerticalOffset(0);
        this.hands = {};
        for(let hand of [Hands.RIGHT, Hands.LEFT]) {
            let peerHand = new PeerHand(hand);
            this.hands[hand] = peerHand;
            peerHand.addToScene(this._object);
        }
    }

    updateScale(scale) {
        this._object.scale.set(scale, scale, scale);
    }

    updateUsername(username) {
        if(this._username == username) return;
        this._username = username;
        let shortName = username = stringWithMaxLength(username || '...', 17);
        this._usernameBlock.children.forEach((block) => {
            block.children[1].set({ content: shortName });
        });
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
        if(UserMessageCodes.AVATAR & codes) {
            this._updateAvatarData(float32Array, index);
            index += 6;
        }
        if(UserMessageCodes.LEFT_HAND & codes) {
            this._updateHandData(float32Array, index, Hands.LEFT);
            index += 6;
        }
        if(UserMessageCodes.RIGHT_HAND & codes) {
            this._updateHandData(float32Array, index, Hands.RIGHT);
            index += 6;
        }
        if(UserMessageCodes.USER_VELOCITY & codes) {
            this._updateVelocity(float32Array, index, timeDelta);
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
