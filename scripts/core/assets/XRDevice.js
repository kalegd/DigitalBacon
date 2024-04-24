/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Euler, Mesh, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const TTL = 5;

export default class XRDevice extends InternalAssetEntity {
    constructor(params = {}) {
        if(!params['assetId']) params['assetId'] = XRDevice.assetId;
        super(params);
        this._ttl = TTL;
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
        let owner = ProjectHandler.getSessionAsset(params['parentId']);
        if(owner.registerXRDevice) {
            owner.registerXRDevice(this);
        }
    }

    _enableARMask() {
        this._isAR = global.xrSessionType == 'AR';
        if(this._isAR) this._setARMask();
        PubSub.subscribe(this._id, PubSubTopics.SESSION_STARTED, () => {
            let isAR = global.xrSessionType == 'AR';
            if(this._isAR == isAR) return;
            this._isAR = isAR;
            if(isAR) {
                this._setARMask();
            } else {
                this._removeARMask();
            }
        });
    }

    _setARMask() {
        this._object.traverse((node) => {
            if (node instanceof Mesh) {
                node.renderOrder = -Infinity;
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        node.material.forEach((mtrl) => {
                            mtrl.colorWrite = false;
                        });
                    }
                    else {
                        node.material.colorWrite = false;
                    }
                }
            }
        });
    }

    _removeARMask() {
        this._object.traverse((node) => {
            if (node instanceof Mesh) {
                node.renderOrder = 0;
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        node.material.forEach((mtrl) => {
                            mtrl.colorWrite = true;
                        });
                    }
                    else {
                        node.material.colorWrite = true;
                    }
                }
            }
        });
    }

    exportParams() {
        let params = super.exportParams();
        params['modelUrl'] = this._modelUrl;
        return params;
    }

    isInScene() {
        return this._object.parent != null;
    }

    get modelUrl() { return this._modelUrl; }

    getModelObject() {
        return this._modelObject;
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

    set modelUrl(modelUrl) { this._modelUrl = modelUrl; }

    decrementTTL(timeDelta) {
        this._ttl -= timeDelta;
        if(this._ttl < 0) {
            ProjectHandler.deleteAsset(this);
        }
    }

    resetTTL() {
        this._ttl = TTL;
    }

    onAddToProject() {
        this._live = true;
    }

    onRemoveFromProject() {
        super.onRemoveFromProject();
        this._live = false;
    }

    static assetId = '0a90fe9c-be4d-4298-a896-9bd99abad8e6';
    static assetName = 'XR Device';
}

ProjectHandler.registerAsset(XRDevice);
LibraryHandler.loadBuiltIn(XRDevice);
