/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import BasicMovement from '/scripts/core/assets/BasicMovement.js';
import UserHand from '/scripts/core/assets/UserHand.js';
import Hands from '/scripts/core/enums/Hands.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import UserMessageCodes from '/scripts/core/enums/UserMessageCodes.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';

const AVATAR_KEY = "DigitalBacon:Avatar";
  
class UserController {
    init(params) {
        if(params == null) {
            params = {};
        }
        this._dynamicAssets = [];
        this._userObj = params['User Object'];
        this._flightEnabled = params['Flight Enabled'] || false;
        this._avatarUrl = localStorage.getItem(AVATAR_KEY)
            || 'https://d1a370nemizbjq.cloudfront.net/6a141c79-d6e5-4b0d-aa0d-524a8b9b54a4.glb';

        this._setup();
    }

    _setup() {
        if(global.deviceType != "XR") {
            this._avatar = new Avatar({
                'Focus Camera': true,
                'URL': this._avatarUrl,
            });
        } else {
            this.hands = {};
            for(let hand of [Hands.RIGHT, Hands.LEFT]) {
                let userHand = new UserHand(hand);
                this.hands[hand] = userHand;
            }
        }
        this._basicMovement = new BasicMovement({
            'User Object': this._userObj,
            'Avatar': this._avatar,
        });
        this._dynamicAssets.push(this._basicMovement);
    }

    getAvatarUrl() {
        return this._avatarUrl;
    }

    updateAvatar(url) {
        localStorage.setItem(AVATAR_KEY, url);
        this._avatarUrl = url;
        if(global.deviceType != "XR") this._avatar.updateSourceUrl(url);
        PubSub.publish(this._id, PubSubTopics.AVATAR_UPDATED, this._avatarUrl);
    }

    getDistanceBetweenHands() {
        if(global.deviceType != 'XR') return;
        let leftPosition = this.hands[Hands.LEFT].getWorldPosition();
        let rightPosition = this.hands[Hands.RIGHT].getWorldPosition();
        return leftPosition.distanceTo(rightPosition);
    }

    _pushXRDataForRTC(data) {
        let codes = 0;
        global.camera.getWorldPosition(vector3s[0]);
        this._userObj.getWorldPosition(vector3s[1]);
        let position = vector3s[0].sub(vector3s[1]).toArray();

        global.camera.getWorldQuaternion(quaternion);
        quaternion.normalize();
        euler.setFromQuaternion(quaternion);
        let rotation = euler.toArray();
        rotation.pop();

        data.push(...position);
        data.push(...rotation);
        codes += UserMessageCodes.AVATAR;

        for(let hand of [Hands.LEFT, Hands.RIGHT]) {
            let userHand = this.hands[hand];
            if(userHand.isInScene()) {
                position = userHand.getWorldPosition().sub(vector3s[1]);
                rotation = userHand.getWorldRotation().toArray();
                rotation.pop();
                data.push(...position.toArray());
                data.push(...rotation);
                codes += UserMessageCodes[hand + '_HAND'];
            }
        }
        return codes;
    }

    getDataForRTC() {
        let codes = 0;
        let data = [];
        if(global.deviceType == "XR") {
            codes += this._pushXRDataForRTC(data);
        }
        let worldVelocity = this._basicMovement.getWorldVelocity();
        if(worldVelocity.length() >= 0.00001) {
            data.push(...this._basicMovement.getWorldVelocity().toArray());
            codes += UserMessageCodes.USER_VELOCITY;
        }
        if(global.renderer.info.render.frame % 300 == 0) {
            this._userObj.getWorldPosition(vector3s[0]);
            data.push(...vector3s[0].toArray());
            codes += UserMessageCodes.USER_POSITION;
        }
        let codesArray = new Uint8Array([codes]);
        return [codesArray.buffer, Float32Array.from(data).buffer];
    }

    addToScene(scene) {
        if(global.deviceType != "XR") {
            this._avatar.addToScene(global.cameraFocus);
        } else {
            this.hands[Hands.RIGHT].addToScene(scene);
            this.hands[Hands.LEFT].addToScene(scene);
        }
    }

    removeFromScene() {
        if(global.deviceType != "XR") {
            this._avatar.removeFromScene();
        } else {
            this.hands[Hands.RIGHT].removeFromScene();
            this.hands[Hands.LEFT].removeFromScene();
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
