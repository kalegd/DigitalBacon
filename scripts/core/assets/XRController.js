/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import XRDevice from '/scripts/core/assets/XRDevice.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Handedness, InputHandler, XRInputDeviceTypes } from '/scripts/DigitalBacon-UI.js';
import { Raycaster, Vector3 } from 'three';

export default class XRController extends XRDevice {
    constructor(params = {}) {
        params['assetId'] = XRController.assetId;
        super(params);
        let controllerModel = params['controllerModel'];
        if(controllerModel) {
            this._object.add(controllerModel);
            this._modelObject = controllerModel;
            this._modelUrl = controllerModel.motionController.assetUrl;
        }
        this._handedness = params['handedness'];
        if(!(this._handedness in Handedness)) {
            throw new Error("hand must be LEFT or RIGHT");
        }
        this._raycasterOrigin = new Vector3();
        this._raycasterDirection = new Vector3();
    }

    _registerOwner(params) {
        let owner = ProjectHandler.getSessionAsset(params['parentId']);
        if(owner.registerXRController) {
            owner.registerXRController(params['handedness'], this);
        }
    }

    exportParams() {
        let params = super.exportParams();
        params['handedness'] = this._handedness;
        return params;
    }

    addFromTargetRay(asset, position, rotation) {
        let controller = InputHandler.getXRController(
            XRInputDeviceTypes.CONTROLLER, this._handedness, 'targetRay');
        let assetObject = asset.object;
        if(!controller) return;
        controller.add(assetObject);
        if(position) assetObject.position.fromArray(position);
        if(rotation) assetObject.rotation.fromArray(rotation);
        asset.attachTo(this);
    }

    get handedness() { return this._handedness; }

    getTargetRayDirection() {
        let xrController = InputHandler.getXRController(
            XRInputDeviceTypes.CONTROLLER, this._handedness, 'targetRay');
        if(!xrController) return null;
        xrController.getWorldDirection(this._raycasterDirection).negate()
            .normalize();
        return this._raycasterDirection;
    }

    getRaycaster() {
        let xrController = InputHandler.getXRController(
            XRInputDeviceTypes.CONTROLLER, this._handedness, 'targetRay');
        if(!xrController) return null;
        xrController.getWorldPosition(this._raycasterOrigin);
        xrController.getWorldDirection(this._raycasterDirection).negate()
            .normalize();
        return new Raycaster(this._raycasterOrigin, this._raycasterDirection,
            0.01, 50);
    }

    isButtonPressed(index) {
        let gamepad = InputHandler.getXRGamepad(this._handedness);
        return gamepad != null && gamepad.buttons[index].pressed;
    }

    pushDataForRTC(data) {
        let position = this._object.position.toArray();
        let rotation = this._object.rotation.toArray();
        rotation.pop();
        data.push(...position);
        data.push(...rotation);
    }

    static assetId = 'c7e118a4-6c74-4e41-bf1d-36f83516e7c3';
    static assetName = 'XR Controller';
}

ProjectHandler.registerAsset(XRController);
LibraryHandler.loadBuiltIn(XRController);
