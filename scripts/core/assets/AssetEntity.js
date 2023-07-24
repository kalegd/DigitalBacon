/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Asset from '/scripts/core/assets/Asset.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { disposeMaterial, fullDispose } from '/scripts/core/helpers/utils.module.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
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
        this._gripInteractable = new GripInteractable(this._object);
        this._pointerInteractable = new PointerInteractable(this._object);
    }

    _getDefaultName() {
        return 'Object';
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

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addNewAsset(this._assetId, params);
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

    addGripAction(selectedFunc, releasedFunc, tool, option){
        let action = this._gripInteractable.addAction(selectedFunc,
            releasedFunc, tool, option);
        if(this._gripInteractable.getActionsLength()==1 && this._object.parent){
            GripInteractableHandler.addInteractable(this._gripInteractable);
        }
        return action;
    }

    addPointerAction(actionFunc, draggableActionFunc, maxDistance, tool,option){
        let action = this._pointerInteractable.addAction(actionFunc,
            draggableActionFunc, maxDistance, tool, option);
        if(this._pointerInteractable.getActionsLength() == 1
                && this._object.parent)
        {
            PointerInteractableHandler.addInteractable(
                this._pointerInteractable);
        }
        return action;
    }

    removeGripAction(id) {
        this._gripInteractable.removeAction(id);
        if(this._gripInteractable.getActionsLength() == 0) {
            GripInteractableHandler.removeInteractable(
                this._gripInteractable);
        }
    }

    removePointerAction(id) {
        this._pointerInteractable.removeAction(id);
        if(this._pointerInteractable.getActionsLength() == 0) {
            PointerInteractableHandler.removeInteractable(
                this._pointerInteractable);
        }
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

    addToScene(scene) {
        if(scene) scene.add(this._object);
        if(this._gripInteractable.getActionsLength() > 0) {
            GripInteractableHandler.addInteractable(
                this._gripInteractable);
        }
        if(this._pointerInteractable.getActionsLength() > 0) {
            PointerInteractableHandler.addInteractable(
                this._pointerInteractable);
        }
    }

    removeFromScene() {
        if(this._object.parent) {
            GripInteractableHandler.removeInteractable(
                this._gripInteractable);
            PointerInteractableHandler.removeInteractable(
                this._pointerInteractable);
            this._object.parent.remove(this._object);
            fullDispose(this._object);
        }
    }
}
