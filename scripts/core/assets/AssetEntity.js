/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Asset from '/scripts/core/assets/Asset.js';
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { disposeMaterial, fullDispose } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class AssetEntity extends Asset {
    constructor(params = {}) {
        super(params);
        this._object = new THREE.Object3D();
        let position = (params['position']) ? params['position'] : [0,0,0];
        let rotation = (params['rotation']) ? params['rotation'] : [0,0,0];
        let scale = (params['scale']) ? params['scale'] : [1,1,1];
        this.visualEdit = params['visualEdit'] || false;
        this._object.position.fromArray(position);
        this._object.rotation.fromArray(rotation);
        this._object.scale.fromArray(scale);
    }

    _getDefaultName() {
        return 'Object';
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
        let params = super.exportParams();
        params['position'] = this.getPosition();
        params['rotation'] = this.getRotation();
        params['scale'] = this.getScale();
        params['visualEdit'] = this.getVisualEdit();
        return params;
    }

    getObject() {
        return this._object;
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

    getWorldPosition(vector3) {
        if(!vector3) vector3 = vector3s[0];
        this._object.getWorldPosition(vector3);
        return vector3;
    }

    getWorldQuaternion(quat) {
        if(!quat) quat = quaternion;
        this._object.getWorldQuaternion(quat);
        return quat;
    }

    getWorldScale(vector3) {
        if(!vector3) vector3 = vector3s[0];
        this._object.getWorldScale(vector3);
        return vector3;
    }

    setPosition(position) {
        this._object.position.fromArray(position);
    }

    setRotation(rotation) {
        this._object.rotation.fromArray(rotation);
    }

    setRotationFromQuaternion(quat) {
        quaternion.fromArray(quat);
        this._object.setRotationFromQuaternion(quaternion);
    }

    setScale(scale) {
        this._object.scale.fromArray(scale);
    }

    setVisualEdit(visualEdit) {
        this.visualEdit = visualEdit;
    }

    addComponent(componentId) {
        let component = ComponentsHandler.getComponent(componentId);
        if(!component) {
            console.error('ERROR: Component not found');
            return;
        }
        this._components.add(component);
        return component;
    }

    removeComponent(componentId) {
        let component = ComponentsHandler.getSessionComponent(componentId);
        if(!component) {
            console.error('ERROR: Component not found');
            return;
        }
        this._components.delete(component);
        return component;
    }

    addToScene(scene) {
        if(scene) scene.add(this._object);
    }

    removeFromScene() {
        if(this._object.parent) {
            this._object.parent.remove(this._object);
            fullDispose(this._object);
        }
    }
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}
