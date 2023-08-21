/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Asset from '/scripts/core/assets/Asset.js';
import Scene from '/scripts/core/assets/Scene.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { disposeMaterial, fullDispose } from '/scripts/core/helpers/utils.module.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import * as THREE from 'three';

export default class AssetEntity extends Asset {
    constructor(params = {}) {
        super(params);
        this._object = params['object'] || new THREE.Object3D();
        this._object.asset = this;
        this._parentId = params['parentId'] || Scene.getId();
        this.children = new Set();
        this.parent = Scene;
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
        params['parentId'] = this._parentId;
        params['position'] = this.getPosition();
        params['rotation'] = this.getRotation();
        params['scale'] = this.getScale();
        params['visualEdit'] = this.getVisualEdit();
        return params;
    }

    addGripAction(selectedFunc, releasedFunc, tool, option){
        let action = this._gripInteractable.addAction(selectedFunc,
            releasedFunc, tool, option);
        return action;
    }

    addPointerAction(actionFunc, draggableActionFunc, maxDistance, tool,option){
        let action = this._pointerInteractable.addAction(actionFunc,
            draggableActionFunc, maxDistance, tool, option);
        return action;
    }

    getGripInteractable() {
        return this._gripInteractable;
    }

    getPointerInteractable() {
        return this._pointerInteractable;
    }

    removeGripAction(id) {
        this._gripInteractable.removeAction(id);
    }

    removePointerAction(id) {
        this._pointerInteractable.removeAction(id);
    }

    getObject() {
        return this._object;
    }

    getParentId() {
        return this._parentId;
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

    setParentId(parentId) {
        this._parentId = parentId;
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

    add(child, ignorePublish) {
        child.addTo(this, ignorePublish);
    }

    addTo(newParent, ignorePublish) {
        if(!newParent) return;
        if(this.parent) this.parent.children.delete(this);
        this.parent = newParent;
        newParent.children.add(this);
        this._parentId = newParent.getId();
        if(this._object.parent) {
            this.addToScene(newParent.getObject(),
                newParent.getPointerInteractable(),
                newParent.getGripInteractable());
        }
        if(!ignorePublish) {
            PubSub.publish(this._id, PubSubTopics.ENTITY_ADDED, {
                parentId: newParent.getId(),
                childId: this._id,
            });
        }
    }

    attach(child, ignorePublish) {
        child.attachTo(this, ignorePublish);
    }

    attachTo(newParent, ignorePublish) {
        if(!newParent) return;
        if(this.parent) this.parent.children.delete(this);
        this.parent = newParent;
        newParent.children.add(this);
        this._parentId = newParent.getId();
        if(this._object.parent) {
            this.attachToScene(newParent.getObject(),
                newParent.getPointerInteractable(),
                newParent.getGripInteractable());
        }
        if(!ignorePublish) {
            PubSub.publish(this._id, PubSubTopics.ENTITY_ATTACHED, {
                parentId: newParent.getId(),
                childId: this._id,
            });
        }
    }

    addToScene(scene, pointerInteractable, gripInteractable) {
        if(scene) scene.add(this._object);
        if(pointerInteractable)
            pointerInteractable.addChild(this._pointerInteractable);
        if(gripInteractable)
            gripInteractable.addChild(this._gripInteractable);
    }

    attachToScene(scene, pointerInteractable, gripInteractable) {
        if(scene) scene.attach(this._object);
        if(pointerInteractable)
            pointerInteractable.addChild(this._pointerInteractable);
        if(gripInteractable)
            gripInteractable.addChild(this._gripInteractable);
    }

    removeFromScene() {
        if(this._gripInteractable.parent) {
            this._gripInteractable.parent.removeChild(this._gripInteractable);
        }
        if(this._pointerInteractable.parent) {
            this._pointerInteractable.parent.removeChild(
                this._pointerInteractable);
        }
        if(this._object.parent) {
            this._object.parent.remove(this._object);
            fullDispose(this._object);
        }
    }
}
