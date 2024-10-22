/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import BasicMovement from '/scripts/core/assets/BasicMovement.js';
import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import XRController from '/scripts/core/assets/XRController.js';
import XRHand from '/scripts/core/assets/XRHand.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import UserMessageCodes from '/scripts/core/enums/UserMessageCodes.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import { Handedness, InputHandler, XRInputDeviceTypes } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const AVATAR_KEY = "DigitalBacon:Avatar";
const USERNAME_KEY = "DigitalBacon:Username";
const FADE_START = 0.6;
const FADE_END = 0.2;
//const FADE_MIDDLE = (FADE_START + FADE_END) / 2;
const FADE_RANGE = FADE_START - FADE_END;
const EPSILON = 0.00000000001;
  
class UserController extends InternalAssetEntity {
    constructor(params = {}) {
        params['assetId'] = UserController.assetId;
        super(params);
        this._isXR = false;
        this._username = localStorage.getItem(USERNAME_KEY)
            || generateRandomUsername();
        this._avatarUrl = localStorage.getItem(AVATAR_KEY)
            || 'https://cdn.jsdelivr.net/npm/digitalbacon@0.3.9/models/default_avatar.glb';
        this._avatarFadeUpdateNumber = 0;
        this._xrControllers = {};
        this._xrHands = {};
        this._xrDevices = new Set();
        this._rtcCounter = 0;
    }

    init() {
        if(global.deviceType == 'XR') {
            this.isXR = true;
        }
        let scale = SettingsHandler.getUserScale();
        this.scale = [scale, scale, scale];
        this._setup();
    }

    _setup() {
        if(global.deviceType != "XR") {
            this._avatar = new Avatar({
                'avatarUrl': this._avatarUrl,
                'parentId': this._id,
                'verticalOffset': global.cameraFocus.position.y,
            });
            AudioHandler.setListenerParent(this._avatar.object);
        } else {
            this._avatar = new Avatar({
                'object': global.camera,
                'parentId': this._id,
                'avatarUrl': this._avatarUrl,
            });
        }
        this._avatar.parent = this;
        ProjectHandler.addAsset(this._avatar);
        this._basicMovement = new BasicMovement({
            'User Object': this._object,
            'Avatar': this._avatar,
        });
    }

    get avatar() { return this._avatar; }
    get isXR() { return this._isXR; }
    get scale() { return super.scale; }
    get username() { return this._username; }

    set avatarUrl(url) {
        localStorage.setItem(AVATAR_KEY, url);
        this._avatarUrl = url;
        this._avatar.updateSourceUrl(url);
        PubSub.publish(this._id, PubSubTopics.INTERNAL_UPDATED,
            { asset: this._avatar, fields: ['avatarUrl'] });
    }

    set isXR(isXR) { this._isXR = isXR; }
    set scale(scale) {
        super.scale = scale;
        global.camera.scale.set(1, 1, 1);
        let object = global.camera.parent;
        while(object) {
            global.camera.scale.divide(object.scale);
            object = object.parent;
        }
        global.camera.near = 0.1 / global.camera.scale.x;
        global.camera.far = Math.max(1000, 1000 / global.camera.scale.x);
        global.camera.updateProjectionMatrix();
        PubSub.publish(this._id, PubSubTopics.INTERNAL_UPDATED,
            { asset: this, fields: ['scale'] });
    }
    set username(username) {
        localStorage.setItem(USERNAME_KEY, username);
        this._username = username;
        PubSub.publish(this._id, PubSubTopics.USERNAME_UPDATED, this._username);
    }

    getController(handedness) {
        return this._xrControllers[handedness];
    }

    getHand(handedness) {
        return this._xrHands[handedness];
    }

    getXRDevices() {
        return this._xrDevices;
    }

    registerXRController(handedness, xrController) {
        this._xrControllers[handedness] = xrController;
        this._xrDevices.add(xrController);
    }

    registerXRHand(handedness, xrHand) {
        this._xrHands[handedness] = xrHand;
        this._xrDevices.add(xrHand);
    }

    registerXRDevice(xrDevice) {
        this._xrDevices.add(xrDevice);
    }

    disableBasicMovement() {
        this._basicMovement.disable();
    }

    enableBasicMovement() {
        this._basicMovement.enable();
    }

    getDistanceBetweenHands() {
        if(global.deviceType != 'XR') return;
        let leftController = this._xrControllers[Handedness.LEFT];
        let rightController = this._xrControllers[Handedness.RIGHT];
        if(!leftController || !rightController) {
            leftController = this._xrHands[Handedness.LEFT];
            rightController = this._xrHands[Handedness.RIGHT];
            if(!leftController || !rightController) return;
        }
        if(!leftController.isInScene() || !rightController.isInScene()) return;

        let leftPosition = leftController.getWorldPosition();
        let rightPosition = rightController.getWorldPosition();
        return leftPosition.distanceTo(rightPosition);
    }

    getDataForRTC() {
        let codes = 0;
        let data = [];
        this._rtcCounter++;
        if(global.deviceType == "XR") {
            codes += this._pushAvatarDataForRTC(data);
            codes += this._pushHandsDataForRTC(data);
        } else if(!this._avatar.isDisplayingAvatar()) {
            codes += this._pushAvatarDataForRTC(data);
        }
        let worldVelocity = this._basicMovement.getWorldVelocity();
        if(worldVelocity.length() >= 0.00001) {
            data.push(...this._basicMovement.getWorldVelocity().toArray());
            codes += UserMessageCodes.USER_VELOCITY;
        }
        if(this._rtcCounter % 300 == 0) {
            this._object.getWorldPosition(vector3s[0]);
            data.push(...vector3s[0].toArray());
            codes += UserMessageCodes.USER_POSITION;
        }
        let codesArray = new Uint8Array([codes]);
        return [codesArray.buffer, Float32Array.from(data).buffer];
    }

    _pushAvatarDataForRTC(data) {
        let position = global.camera.position.toArray();
        let rotation = global.camera.rotation.toArray();
        rotation.pop();

        data.push(...position);
        data.push(...rotation);
        return UserMessageCodes.AVATAR;
    }

    _pushHandsDataForRTC(data) {
        let codes = 0;
        for(let type of ['CONTROLLER', 'HAND']) {
            let map = (type == 'CONTROLLER') ? '_xrControllers' : '_xrHands';
            for(let handedness of [Handedness.LEFT, Handedness.RIGHT]) {
                let controller = this[map][handedness];
                if(controller && controller.isInScene()) {
                    controller.pushDataForRTC(data);
                    codes += UserMessageCodes[handedness + '_' + type];
                }
            }
        }
        return codes;
    }

    hasChild(object) {
        return object.parent == this._object;
    }

    exportParams() {
        let params = super.exportParams();
        params['isXR'] = this._isXR;
        params['username'] = this._username;
        return params;
    }

    _updateAvatar() {
        if(!this._avatar.isDisplayingAvatar()) {
            let data = [];
            this._pushAvatarDataForRTC(data);
            let rotation = data.slice(3, 6);
            this._avatar.object.rotation.fromArray(rotation);
        }
        let updateNumber = SessionHandler.getControlsUpdateNumber();
        if(this._avatarFadeUpdateNumber == updateNumber) return;
        this._avatarFadeUpdateNumber = updateNumber;
        let cameraDistance = SessionHandler.getCameraDistance();
        if(cameraDistance > FADE_START * 2) return;
        let diff = cameraDistance - this._avatarFadeCameraDistance;
        if(Math.abs(diff) < EPSILON) return;
        //Fade Logic Start
        this._avatarFadeCameraDistance = cameraDistance;
        let fadePercent = Math.max(cameraDistance, FADE_END);
        fadePercent = (fadePercent - FADE_END) / FADE_RANGE;
        if(fadePercent == 0) {
            if(this._avatar.isDisplayingAvatar()) {
                this._basicMovement.setPerspective(1);
                PubSub.publish(this._id, PubSubTopics.USER_PERSPECTIVE_CHANGED,
                    1);
                this._avatar.hideAvatar();
            }
            return;
        } else if(!this._avatar.isDisplayingAvatar()) {
            this._basicMovement.setPerspective(3);
            PubSub.publish(this._id, PubSubTopics.USER_PERSPECTIVE_CHANGED, 3);
            this._avatar.displayAvatar();
        }
        (fadePercent < 1)
            ? this._avatar.fade(fadePercent)
            : this._avatar.endFade();
        //Fade Logic end

        //Disappear Logic start
        //let object = this._avatar.getObject();
        //if(cameraDistance < FADE_MIDDLE) {
        //    if(object.parent) this._avatar.removeFromScene();
        //} else if(!object.parent) {
        //    this._avatar.addToScene(global.cameraFocus,
        //        this._pointerInteractable, this._gripInteractable);
        //}
        //Disappear Logic end
    }

    update(timeDelta) {
        if(global.deviceType == "XR") {
            this._updateHands(timeDelta);
        } else if(this._avatar) {
            this._updateAvatar();
        }
        this._basicMovement.update(timeDelta);
    }

    _getControllerModelUrl(object) {
        if(object && object.motionController) {
            return object.motionController.assetUrl;
        }
    }

    _updateHands(timeDelta) {
        for(let side in Handedness) {
            this._updateHand(timeDelta, XRInputDeviceTypes.CONTROLLER, side);
            this._updateHand(timeDelta, XRInputDeviceTypes.HAND, side);
        }
    }

    _updateHand(timeDelta, type, handedness) {
        let controller = (type == XRInputDeviceTypes.HAND)
            ? this._xrHands[handedness]
            : this._xrControllers[handedness];
        let controllerModel = InputHandler.getXRControllerModel(type,
            handedness);
        let source = InputHandler.getXRInputSource(type, handedness);
        if(controller && controller._live) {
            if(source) {
                controller.resetTTL();
                if(type==XRInputDeviceTypes.HAND && handedness==Handedness.LEFT)
                    controller.updateHandMenu(timeDelta);
            } else {
                controller.decrementTTL(timeDelta);
            }
        } else if(source && this._getControllerModelUrl(controllerModel)) {
            if(!controller) {
                if(controllerModel.children.length == 0) return;
                let assetClass = (type == XRInputDeviceTypes.HAND)
                    ? XRHand
                    : XRController;
                let xrController = InputHandler.getXRController(type,
                    handedness, 'grip');
                let isTargetRayBased = false;
                if(!xrController) {
                    xrController = InputHandler.getXRController(type,
                        handedness, 'targetRay');
                    isTargetRayBased = true;
                }
                controller = new assetClass({
                    id: xrController.uuid,
                    handedness: handedness,
                    parentId: this._id,
                    controllerModel: controllerModel,
                    object: xrController,
                    isTargetRayBased: isTargetRayBased,
                });
                ProjectHandler.addAsset(controller, false, true);
                //controller.attachTo(this);
                if(type==XRInputDeviceTypes.HAND && handedness==Handedness.LEFT)
                    controller.createHandMenu();
            } else {
                ProjectHandler.addAsset(controller, false, true);
            }
        }
    }

    static assetId = 'ac0ff650-6ad5-4c00-a234-0a320d5a8bef';
    static assetName = 'User';
}

function generateRandomUsername() {
    return String.fromCharCode(97+Math.floor(Math.random() * 26))
            + Math.floor(Math.random() * 100);
}

let userController = new UserController();
export default userController;
