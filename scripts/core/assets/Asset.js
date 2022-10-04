/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Entity from '/scripts/core/assets/Entity.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { disposeMaterial } from '/scripts/core/helpers/utils.module.js';
import AssetHelper from '/scripts/core/helpers/editor/AssetHelper.js';
import * as THREE from 'three';

export default class Asset extends Entity {
    constructor(params = {}) {
        super();
        this._id = params['id'] || this._id;
        this._assetId = params['assetId'];
        this._name = ('name' in params) ? params['name'] : 'Object';
        let position = (params['position']) ? params['position'] : [0,0,0];
        let rotation = (params['rotation']) ? params['rotation'] : [0,0,0];
        let scale = (params['scale']) ? params['scale'] : [1,1,1];
        this.visualEdit = params['visualEdit'] || false;
        this._object.position.fromArray(position);
        this._object.rotation.fromArray(rotation);
        this._object.scale.fromArray(scale);
        if(global.isEditor) this._createEditorHelper();
    }

    _createEditorHelper() {
        this._editorHelper = new AssetHelper(this);
    }

    makeTranslucent() {
        this._object.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        for(let i = 0; i < node.material.length; i++) {
                            let mtrl = node.material[i];
                            let newMaterial = mtrl.clone();
                            makeMaterialTranslucent(newMaterial);
                            newMaterial.userData['oldMaterial'] = mtrl;
                            node.material[i] = newMaterial;
                        }
                    }
                    else {
                        let newMaterial = node.material.clone();
                        makeMaterialTranslucent(newMaterial);
                        newMaterial.userData['oldMaterial'] = node.material;
                        node.material = newMaterial;
                    }
                }
            }
        });
    }

    returnTransparency() {
        this._object.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        for(let i = 0; i < node.material.length; i++) {
                            let mtrl = node.material[i];
                            node.material[i] =
                                mtrl.userData['oldMaterial'];
                            disposeMaterial(mtrl);
                        }
                    }
                    else {
                        let oldMaterial = node.material;
                        node.material = node.material.userData['oldMaterial'];
                        disposeMaterial(oldMaterial);
                    }
                }
            }
        });
    }

    _fetchCloneParams(visualEditOverride) {
        let params = this.exportParams();
        let visualEdit = (visualEditOverride != null)
            ? visualEditOverride
            : this.visualEdit;
        let position = this._object.getWorldPosition(vector3s[0]).toArray();
        let rotation = euler.setFromQuaternion(
            this._object.getWorldQuaternion(quaternion)).toArray();
        params['visualEdit'] = visualEdit;
        params['position'] = position;
        params['rotation'] = rotation;
        delete params['id'];
        return params;
    }

    preview() {
        let params = this.exportParams();
        params['visualEdit'] = false;
        params['isPreview'] = true;
        delete params['id'];
        return new this.constructor(params);
    }

    exportParams() {
        return {
            "id": this._id,
            "name": this._name,
            "assetId": this._assetId,
            "position": this.getPosition(),
            "rotation": this.getRotation(),
            "scale": this.getScale(),
            "visualEdit": this.visualEdit,
        };
    }

    getAssetId() {
        return this._assetId;
    }

    getEditorHelper() {
        return this._editorHelper;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }

    getPosition() {
        return this._object.position.toArray();
    }

    getRotation() {
        return this._object.rotation.toArray();
    }

    getScale() {
        return this._object.scale.toArray();
    }

    getVisualEdit() {
        return this.visualEdit;
    }

    setPosition(position) {
        this._object.position.fromArray(position);
    }

    setRotation(rotation) {
        this._object.rotation.fromArray(rotation);
    }

    setScale(scale) {
        this._object.scale.fromArray(scale);
    }

    setVisualEdit(visualEdit) {
        if(this._editorHelper) {
            this._editorHelper.updateVisualEdit(visualEdit, true, true);
        } else {
            this.visualEdit = visualEdit;
        }
    }

    setName(name) {
        if(name == null || this._name == name) return;
        this._name = name;
    }

    addToScene(scene) {
        super.addToScene(scene);
        if(global.isEditor) this._editorHelper.addToScene();
    }

    removeFromScene() {
        super.removeFromScene();
        if(global.isEditor) this._editorHelper.removeFromScene();
    }
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}
