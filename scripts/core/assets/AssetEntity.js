/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import Scene from '/scripts/core/assets/Scene.js';
import InternalMessageIds from '/scripts/core/enums/InternalMessageIds.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { vector3s, quaternion } from '/scripts/core/helpers/constants.js';
import { concatenateArrayBuffers, fullDispose } from '/scripts/core/helpers/utils.module.js';
import { utils, GripInteractable, PointerInteractable, TouchInteractable } from '/scripts/DigitalBacon-UI.js';
import * as THREE from 'three';

const INTERACTABLE_PARAMS = ['pointerInteractable', 'gripInteractable', 'touchInteractable'];

export default class AssetEntity extends Asset {
    constructor(params = {}) {
        super(params);
        this._object = params['object'] || new THREE.Object3D();
        this._object.asset = this;
        this._object.addEventListener('added', () => this._onAdded());
        this._object.addEventListener('removed', () => this._onRemoved());
        if('parentId' in params) {
            this._parentId = params['parentId'];
        } else {
            this._parentId = Scene.id;
        }
        this.children = new Set();
        this.parent = ProjectHandler.getSessionAsset(this._parentId);
        if(this.parent && !params.isPreview) this.parent.children.add(this);
        let position = (params['position']) ? params['position'] : [0,0,0];
        let rotation = (params['rotation']) ? params['rotation'] : [0,0,0];
        let scale = (params['scale']) ? params['scale'] : [1,1,1];
        this._visualEdit = params['visualEdit'] || false;
        this._object.position.fromArray(position);
        this._object.rotation.fromArray(rotation);
        this._object.scale.fromArray(scale);
        new GripInteractable(this._object);
        new PointerInteractable(this._object);
        new TouchInteractable(this._object);
        this._positionBytes = new Float64Array(3);
        this._rotationBytes = new Float64Array(3);
        this._scaleBytes = new Float64Array(3);
        this._transformationBytes = new Float64Array(9);
    }

    _getDefaultName() {
        return 'Object';
    }

    _fetchCloneParams(visualEditOverride) {
        let params = this.exportParams();
        let visualEdit = (visualEditOverride != null)
            ? visualEditOverride
            : this._visualEdit;
        params['visualEdit'] = visualEdit;
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
        delete params['parentId'];
        return new this.constructor(params);
    }

    exportParams() {
        let params = super.exportParams();
        params['parentId'] = this._parentId;
        params['position'] = this.position;
        params['rotation'] = this.rotation;
        params['scale'] = this.scale;
        params['visualEdit'] = this._visualEdit;
        return params;
    }

    _updateBVH() {
        utils.updateBVHForComplexObject(this._object);
    }

    get gripInteractable() { return this._object.gripInteractable; }
    get object() { return this._object; }
    get parentId() { return this._parentId; }
    get pointerInteractable() { return this._object.pointerInteractable; }
    get position() { return this._object.position.toArray(); }
    get rotation() {
        let rotation = this._object.rotation.toArray();
        rotation.pop();
        return rotation;
    }
    get scale() { return this._object.scale.toArray(); }
    get touchInteractable() { return this._object.touchInteractable; }
    get visualEdit() { return this._visualEdit; }

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

    set parentId(parentId) {
        if(this._parentId == parentId) return;
        let parentAsset = ProjectHandler.getSessionAsset(parentId);
        if(!parentAsset) {
            if(this._object.parent) this._object.parent.remove(this._object);
            if(this.parent) this.parent.children.delete(this);
            this.parent = null;
        } else if(this._parentId != null) {
            this.attachTo(parentAsset, true);
        } else {
            this.addTo(parentAsset, true);
        }
        this._parentId = parentId;
    }
    set position(position) { this._object.position.fromArray(position); }
    set rotation(rotation) { this._object.rotation.fromArray(rotation); }
    set scale(scale) { this._object.scale.fromArray(scale); }
    set visualEdit(visualEdit) { this._visualEdit = visualEdit; }

    setRotationFromQuaternion(quat) {
        quaternion.fromArray(quat);
        this._object.setRotationFromQuaternion(quaternion);
    }

    publishPosition() {
        this._positionBytes.set(this._object.position.toArray());
        let message =concatenateArrayBuffers(this._idBytes,this._positionBytes);
        PartyHandler.publishInternalBufferMessage(
            InternalMessageIds.ENTITY_POSITION, message);
    }

    publishRotation() {
        this._rotationBytes.set(this.rotation);
        let message =concatenateArrayBuffers(this._idBytes,this._rotationBytes);
        PartyHandler.publishInternalBufferMessage(
            InternalMessageIds.ENTITY_ROTATION, message);
    }

    publishScale() {
        this._scaleBytes.set(this._object.scale.toArray());
        let message = concatenateArrayBuffers(this._idBytes, this._scaleBytes);
        PartyHandler.publishInternalBufferMessage(
            InternalMessageIds.ENTITY_SCALE, message);
    }

    publishTransformation() {
        this._transformationBytes.set(this._object.position.toArray());
        this._transformationBytes.set(this.rotation, 3);
        this._transformationBytes.set(this._object.scale.toArray(), 6);
        let message = concatenateArrayBuffers(this._idBytes,
            this._transformationBytes);
        PartyHandler.publishInternalBufferMessage(
            InternalMessageIds.ENTITY_TRANSFORMATION, message);
    }

    add(child, ignorePublish) {
        child.addTo(this, ignorePublish);
    }

    addTo(newParent, ignorePublish) {
        if(!newParent) return;
        if(this.parent) this.parent.children.delete(this);
        this.parent = newParent;
        newParent.children.add(this);
        this._parentId = newParent.id;
        if(ProjectHandler.getAsset(this._id))
            newParent.object.add(this._object);
        if(!ignorePublish) {
            PubSub.publish(this._id, PubSubTopics.ENTITY_ADDED, {
                parentId: newParent.id,
                childId: this._id,
            }, true);
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
        this._parentId = newParent.id;
        if(ProjectHandler.getAsset(this._id))
            newParent.object.attach(this._object);
        if(!ignorePublish) {
            PubSub.publish(this._id, PubSubTopics.ENTITY_ATTACHED, {
                parentId: newParent.id,
                childId: this._id,
            }, true);
        }
    }

    _onAdded() {
        for(let param of INTERACTABLE_PARAMS) {
            let interactable = this._object[param];
            if(this._object.parent?.[param]) {
                this._object.parent?.[param].addChild(interactable);
            } else if(interactable.parent) {
                interactable.parent.removeChild(interactable);
            }
        }
    }

    _onRemoved() {
        for(let param of INTERACTABLE_PARAMS) {
            let interactable = this._object[param];
            if(interactable.parent) {
                interactable.parent.removeChild(interactable);
            }
        }
    }

    onRemoveFromProject() {
        if(this._object.parent) {
            this._object.parent.remove(this._object);
            fullDispose(this._object);
        }
    }
}
