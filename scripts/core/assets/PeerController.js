/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import Hands from '/scripts/core/enums/Hands.js';
import UserMessageCodes from '/scripts/core/enums/UserMessageCodes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { vector3s, Fonts } from '/scripts/core/helpers/constants.js';
import { stringWithMaxLength } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import * as THREE from 'three';

const ERROR_FIX_FRAMES = 30;
const ERROR_FACTOR = 1 / ERROR_FIX_FRAMES;

export default class PeerController extends InternalAssetEntity {
    constructor(params = {}) {
        params['assetId'] = PeerController.assetId;
        super(params);
        this._velocity = new THREE.Vector3();
        this._positionError = new THREE.Vector3();
        this._errorFixFrame = ERROR_FIX_FRAMES;
        this._isXR = params['isXR'];
        this._avatarUrl = params['avatarUrl'];
        this._username = params['username'] || '...';
        this._displayingUsername = params['displayingUsername'];
        this._xrControllers = {};
        this._xrHands = {};
        this._xrDevices = new Set();
        this._setup();
    }

    _setup() {
        this._avatar = new Avatar({
            'Vertical Offset': 1.7,
            'URL': this._avatarUrl,
        });
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
        if(this._isXR) object.position.fromArray(float32Array, index);
        let rotation = float32Array.slice(index + 3, index + 6);
        object.rotation.fromArray(rotation);
    }

    _updateHandData(float32Array, index, hand) {
        if(!this._xrControllers[hand]) return;
        let peerHand = this._xrControllers[hand].getObject();
        peerHand.position.fromArray(float32Array, index);
        let rotation = float32Array.slice(index + 3, index + 6);
        peerHand.rotation.fromArray(rotation);
    }

    _updateVelocity(float32Array, index) {
        this._velocity.fromArray(float32Array, index);
        if(!this._isXR && !this._firstPerson) {
            let object = this._avatar.getObject();
            vector3s[0].copy(this._velocity).setY(0).multiplyScalar(-1);
            if(vector3s[0].length() < 0.001) return;
            object.getWorldPosition(vector3s[1]).add(vector3s[0]);
            object.lookAt(vector3s[1]);
        }
    }

    _updatePosition(float32Array, index) {
        this._positionError.fromArray(float32Array, index)
            .sub(this._object.position)
        this._errorFixFrame = 0;
    }

    exportParams() {
        let params = super.exportParams();
        params['avatarUrl'] = this._avatarUrl;
        params['isXR'] = this._isXR;
        params['username'] = this._username;
        return params;
    }

    getAvatar() {
        return this._avatar;
    }

    getAvatarUrl() {
        return this._avatarUrl;
    }

    getIsXR() {
        return this._isXR;
    }

    getUsername() {
        return this._username;
    }

    setAvatarUrl(url) {
        this._avatarUrl = url;
        this._avatar.updateSourceUrl(url);
    }

    setIsXR(isXR) {
        this._isXR = isXR;
    }

    setUsername(username) {
        if(this._username == username) return;
        this._username = username;
        let shortName = username = stringWithMaxLength(username || '...', 17);
        this._usernameBlock.children.forEach((block) => {
            block.children[1].set({ content: shortName });
        });
    }

    updateAvatar(url) {
        this._avatar.updateSourceUrl(url);
    }

    getController(hand) {
        return this._xrControllers[hand];
    }

    getHand(hand) {
        return this._xrHands[hand];
    }

    getXRDevices() {
        return this._xrDevices;
    }

    registerXRController(hand, xrController) {
        this._xrControllers[hand] = xrController;
        this._xrDevices.add(xrController);
    }

    registerXRHand(hand, xrHand) {
        this._xrHands[hand] = xrHand;
        this._xrDevices.add(xrHand);
    }

    registerXRDevice(xrDevice) {
        this._xrDevices.add(xrDevice);
    }

    setDisplayingUsername(displayingUsername) {
        if(this._displayingUsername == displayingUsername) return;
        this._displayingUsername = displayingUsername;
        if(this._displayingUsername) {
            this._object.add(this._usernameBlock);
        } else {
            this._object.remove(this._usernameBlock);
        }
    }

    setFirstPerson(firstPerson) {
        this._firstPerson = firstPerson;
    }

    update(timeDelta) {
        this._object.position.addScaledVector(this._velocity, timeDelta);
        if(this._errorFixFrame < ERROR_FIX_FRAMES) {
            this._object.position.addScaledVector(this._positionError,
                ERROR_FACTOR);
            this._errorFixFrame++;
        }
    }

    processMessage(message) {
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
            this._updateVelocity(float32Array, index);
            index += 3;
        } else {
            this._velocity.set(0, 0, 0);
        }
        if(UserMessageCodes.USER_POSITION & codes) {
            this._updatePosition(float32Array, index);
            index += 3;
        }
    }

    addToScene(scene) {
        super.addToScene(scene);
        this._avatar.addToScene(this._object);
        if(this._displayingUsername) {
            this._object.add(this._usernameBlock);
        } else {
            this._object.remove(this._usernameBlock);
        }
    }

    //removeFromScene() {
    //    if(this._avatar) this._avatar.removeFromScene();
    //    super.removeFromScene();
    //}

    static assetId = 'ac0ff650-6ad5-4c00-a234-0a320d5a8bef';
    static assetName = 'Peer';
}

ProjectHandler.registerAsset(PeerController);
LibraryHandler.loadBuiltIn(PeerController);
