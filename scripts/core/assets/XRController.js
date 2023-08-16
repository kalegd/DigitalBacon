/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import XRDevice from '/scripts/core/assets/XRDevice.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Euler, Quaternion, Vector3 } from 'three';

export default class XRController extends XRDevice {
    constructor(params = {}) {
        params['assetId'] = XRController.assetId;
        super(params);
        console.log("Creating XRController");
        let controllerModel = params['controllerModel'];
        if(controllerModel) {
            this._object.add(controllerModel);
            this._modelUrl = controllerModel.motionController.assetUrl;
        }
        this._hand = params['hand'];
        if(!this._hand in Handedness) {
            throw new Error("hand must be LEFT or RIGHT");
        }
    }

    _registerOwner(params) {
        let owner = ProjectHandler.getSessionAsset(params['ownerId']);
        if(owner) {
            owner.registerXRController(params['hand'], this);
        }
    }

    exportParams() {
        let params = super.exportParams();
        params['hand'] = this._hand;
        return params;
    }

    static assetId = 'c7e118a4-6c74-4e41-bf1d-36f83516e7c3';
    static assetName = 'XR Controller';
}

ProjectHandler.registerAsset(XRController);
LibraryHandler.loadBuiltIn(XRController);
