/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import XRDevice from '/scripts/core/assets/XRDevice.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Handedness, InputHandler, XRInputDeviceTypes } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import { Raycaster, Vector3 } from 'three';

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/';

export default class XRHand extends XRDevice {
    constructor(params = {}) {
        params['assetId'] = XRHand.assetId;
        super(params);
        this._handedness = params['handedness'];
        if(!(this._handedness in Handedness)) {
            throw new Error("hand must be LEFT or RIGHT");
        }
        let controllerModel = params['controllerModel'];
        if(controllerModel) {
            this._object.add(controllerModel);
            this._modelObject = controllerModel;
            this._modelUrl = DEFAULT_HAND_PROFILE_PATH
                + this._handedness.toLowerCase() + '.glb';
            this._isUsers = true;
            this._enableARMask();
        }
        this._palmDirection = new Vector3();
        this._raycasterOrigin = new Vector3();
        this._raycasterDirection = new Vector3();
    }

    _registerOwner(params) {
        let owner = ProjectHandler.getSessionAsset(params['parentId']);
        if(owner.registerXRHand) {
            owner.registerXRHand(params['handedness'], this);
        }
    }

    exportParams() {
        let params = super.exportParams();
        params['handedness'] = this._handedness;
        return params;
    }

    addFromTargetRay(asset, position, rotation) {
        let hand = InputHandler.getXRController(XRInputDeviceTypes.HAND,
            this._handedness, 'targetRay');
        let assetObject = asset.object;
        if(!hand) return;
        hand.add(assetObject);
        if(position) assetObject.position.fromArray(position);
        if(rotation) assetObject.rotation.fromArray(rotation);
        asset.attachTo(this);
    }

    get handedness() { return this._handedness; }

    getTargetRayDirection() {
        let xrController = InputHandler.getXRController(XRInputDeviceTypes.HAND,
            this._handedness, 'targetRay');
        if(!xrController) return null;
        xrController.getWorldDirection(this._raycasterDirection).negate()
            .normalize();
        return this._raycasterDirection;
    }

    getRaycaster() {
        let xrHand = InputHandler.getXRController(XRInputDeviceTypes.HAND,
            this._handedness, 'targetRay');
        if(!xrHand) return null;
        xrHand.getWorldPosition(this._raycasterOrigin);
        xrHand.getWorldDirection(this._raycasterDirection).negate()
            .normalize();
        return new Raycaster(this._raycasterOrigin, this._raycasterDirection,
            0.01, 50);
    }

    getPalmDirection() {
        if(this._isUsers) {
            let model = InputHandler.getXRControllerModel(
                XRInputDeviceTypes.HAND, this._handedness);
            this._palmDirection.copy(model.motionController.palmDirection);
        } else if(this._handedness == Handedness.LEFT) {
            this._palmDirection.set(0.9750661112291139, -0.10431964344732528,
                0.1958660688459766);
            this._object.localToWorld(this._palmDirection)
                .sub(this.getWorldPosition());
        } else {
            this._palmDirection.set(-0.9750665315668015, -0.1043194340529684,
                0.19586401335899684);
            this._object.localToWorld(this._palmDirection)
                .sub(this.getWorldPosition());
        }
        return this._palmDirection;
    }

    isButtonPressed(index) {
        let model = InputHandler.getXRControllerModel(XRInputDeviceTypes.HAND,
            this._handedness);
        if(index == 0) {
            return model.motionController.isPinching;
        } else if(index == 1) {
            return model.motionController.isGrabbing;
        }
        return false;
    }

    pushDataForRTC(data) {
        let position = this._object.position.toArray();
        let rotation = this._object.rotation.toArray();
        rotation.pop();
        data.push(...position);
        data.push(...rotation);
    }

    static assetId = 'd26f490e-dc3a-4f96-82d4-ab9f3bdb92b2';
    static assetName = 'XR Hand';
}

ProjectHandler.registerAsset(XRHand);
LibraryHandler.loadBuiltIn(XRHand);
