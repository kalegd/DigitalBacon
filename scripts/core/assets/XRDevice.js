/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Euler, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const TTL = 5;

export default class XRDevice extends InternalAssetEntity {
    constructor(params = {}) {
        if(!params['assetId']) params['assetId'] = XRDevice.assetId;
        super(params);
        this._ttl = TTL;
        this._ownerId = params['ownerId'];
        this._modelUrl = params['modelUrl'];
        if(this._modelUrl) {
            this._loadModelFromUrl();
        }
        this._vector3 = new Vector3();
        this._euler = new Euler();
        this._quaternion = new Quaternion();
        this._registerOwner(params);
    }

    _loadModelFromUrl() {
        let gltfLoader = new GLTFLoader();
        gltfLoader.load(this._modelUrl, (gltf) => {
            this._modelObject = gltf.scene;
            this._object.add(gltf.scene);
        });
    }

    _registerOwner(params) {
        let owner = ProjectHandler.getSessionAsset(params['ownerId']);
        if(owner) {
            owner.registerXRDevice(this);
        }
    }

    exportParams() {
        let params = super.exportParams();
        params['ownerId'] = this._ownerId;
        params['modelUrl'] = this._modelUrl;
        return params;
    }

    isInScene() {
        return this._object.parent != null;
    }

    getModelObject() {
        return this._modelObject;
    }

    getModelUrl() {
        return this._modelUrl;
    }

    getOwnerId() {
        return this._ownerId;
    }

    getWorldPosition() {
        this._object.getWorldPosition(this._vector3);
        return this._vector3;
    }

    getWorldRotation() {
        this._object.getWorldQuaternion(this._quaternion);
        this._quaternion.normalize();
        this._euler.setFromQuaternion(this._quaternion);
        return this._euler;
    }

    getWorldQuaternion() {
        this._object.getWorldQuaternion(this._quaternion);
        return this._quaternion;
    }

    setModelUrl(modelUrl) {
        this._modelUrl = modelUrl;
    }

    setOwnerId(ownerId) {
        this._ownerId = ownerId;
    }

    decrementTTL(timeDelta) {
        this._ttl -= timeDelta;
        if(this._ttl < 0) {
            ProjectHandler.deleteAsset(this);
        }
    }

    resetTTL() {
        this._ttl = TTL;
    }

    static assetId = '0a90fe9c-be4d-4298-a896-9bd99abad8e6';
    static assetName = 'XR Device';
}

ProjectHandler.registerAsset(XRDevice);
LibraryHandler.loadBuiltIn(XRDevice);
