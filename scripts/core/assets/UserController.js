/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Hands from '/scripts/core/enums/Hands.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import BasicMovement from '/scripts/core/assets/BasicMovement.js';
import UserHand from '/scripts/core/assets/UserHand.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';

import * as THREE from 'three';

const AVATAR_KEY = "DigitalBacon:Avatar";
  
class UserController {
    init(params) {
        if(params == null) {
            params = {};
        }
        this._sceneAssets = new Set();
        this._dynamicAssets = [];
        this._userObj = params['User Object'];
        this._flightEnabled = params['Flight Enabled'] || false;
        this._avatarURL = localStorage.getItem(AVATAR_KEY)
            || '/models/default_avatar.glb';

        this._setup();
    }

    _setup() {
        if(global.deviceType != "XR") {
            this._avatar = new Avatar({
                'Focus Camera': true,
                'URL': this._avatarURL,
            });
            this._sceneAssets.add(this._avatar);
        } else {
            this.hands = {};
            for(let hand of [Hands.RIGHT, Hands.LEFT]) {
                let userHand = new UserHand(hand);
                this.hands[hand] = userHand;
                this._sceneAssets.add(userHand);
            }
        }
        let basicMovement = new BasicMovement({
            'User Object': this._userObj,
            'Avatar': this._avatar,
        });
        this._dynamicAssets.push(basicMovement);
    }

    updateAvatar(url) {
        localStorage.setItem(AVATAR_KEY, url);
        this._avatarURL = url;
        if(global.deviceType != "XR") this._avatar.updateSourceUrl(url);
    }

    getDistanceBetweenHands() {
        if(global.deviceType != 'XR') return;
        let leftPosition = this.hands[Hands.LEFT].getWorldPosition();
        let rightPosition = this.hands[Hands.RIGHT].getWorldPosition();
        return leftPosition.distanceTo(rightPosition);
    }

    addToScene(scene) {
        for(let asset of this._sceneAssets) {
            asset.addToScene(scene);
        }
    }

    removeFromScene() {
        for(let asset of this._sceneAssets) {
            asset.removeFromScene();
        }
    }

    update(timeDelta) {
        for(let i = 0; i < this._dynamicAssets.length; i++) {
            this._dynamicAssets[i].update(timeDelta);
        }
    }
}

let userController = new UserController();
export default userController;
