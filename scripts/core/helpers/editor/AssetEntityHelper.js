/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import InteractionTools from '/scripts/core/enums/InteractionTools.js';
import CopyPasteControlsHandler from '/scripts/core/handlers/CopyPasteControlsHandler.js';
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
import PlaceHandler from '/scripts/core/handlers/hands/PlaceHandler.js';
import RotateHandler from '/scripts/core/handlers/hands/RotateHandler.js';
import ScaleHandler from '/scripts/core/handlers/hands/ScaleHandler.js';
import TranslateHandler from '/scripts/core/handlers/hands/TranslateHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import Box3Helper from '/scripts/core/helpers/Box3Helper.js';
import { disposeMaterial, fullDispose } from '/scripts/core/helpers/utils.module.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import { InteractableStates } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import * as THREE from 'three';

const { AssetField, CheckboxField, EulerField, NumberField, Vector3Field } = EditorHelper.FieldTypes;
const OBJECT_TRANSFORM_PARAMS = ['position', 'rotation', 'scale'];
const TRANSFORM_PUBLISH_FUNCTIONS = {
    position: 'publishPosition',
    rotation: 'publishRotation',
    scale: 'publishScale',
};
const TRS_HANDLERS = [
    { handler: TranslateHandler, tool: InteractionTools.TRANSLATE },
    { handler: RotateHandler, tool: InteractionTools.ROTATE },
    { handler: ScaleHandler, tool: InteractionTools.SCALE },
];
const assetFieldFilter = (asset) => {
    return asset instanceof AssetEntity;
};

export default class AssetEntityHelper extends EditorHelper {
    constructor(asset, updatedTopic) {
        super(asset, updatedTopic);
        this._object = asset.object;
        this._attachedPeers = new Set();
        this._eventListeners = [];
        this._actionsAdded = false;
        this._boundingBox = (global.deviceType == 'XR')
            ? this._asset.gripInteractable._boundingBox
            : new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
        this._overwriteAssetFunctions();
        this._addDeleteSubscriptionForPromotions();
        this._createActions();
    }

    _createActions() {
        if(global.deviceType == "XR") {
            this._asset.gripInteractable.addHoveredCallback((hovered) => {
                (hovered)
                    ? global.scene.add(this._boundingBoxObj)
                    : global.scene.remove(this._boundingBoxObj);
            });
            this._eventListeners.push({ type: 'grip', callback: (message) => {
                this._disableParam('position');
                this._disableParam('rotation');
                this._disableParam('scale');
                this._asset.gripInteractable.capture(message.owner);
                TransformControlsHandler.attach(this._asset, message.owner.id);
            }, tool: InteractionTools.EDIT, topic: 'down' });
            this._eventListeners.push({ type: 'grip', callback: (message) => {
                let twoHandScaling = TransformControlsHandler._twoHandScaling;
                TransformControlsHandler.detach(message.owner.id);
                if(!twoHandScaling) {
                    this._enableParam('position');
                    this._enableParam('rotation');
                    this._enableParam('scale');
                }
            }, tool: InteractionTools.EDIT, topic: 'click' });
            this._eventListeners.push({ type: 'grip', callback: (_) => {
                ProjectHandler.deleteAsset(this._asset);
            }, tool: InteractionTools.DELETE, topic: 'down' });
            this._eventListeners.push({ type: 'pointer', callback: (_) => {
                ProjectHandler.deleteAsset(this._asset);
            }, tool: InteractionTools.DELETE, topic: 'down' });
            this._eventListeners.push({ type: 'pointer', callback: (message) =>{
                CopyPasteControlsHandler.copy(message.owner.id, this._asset);
            }, tool: InteractionTools.COPY_PASTE, topic: 'click' });
            this._eventListeners.push({ type: 'grip', callback: (message) =>{
                PlaceHandler.grab(message.owner.id, this._asset);
            }, tool: InteractionTools.PLACE, topic: 'down' });
            for(let handlerDetails of TRS_HANDLERS) {
                let handler = handlerDetails.handler;
                let tool = handlerDetails.tool;
                this._eventListeners.push({ type: 'grip', callback: (message)=>{
                    this._disableParam('position');
                    this._disableParam('rotation');
                    this._disableParam('scale');
                    this._asset.gripInteractable.capture(message.owner);
                    handler.attach(message.owner.id, this._asset);
                }, tool: tool, topic: 'down' });
                this._eventListeners.push({ type: 'grip', callback: (message)=>{
                    handler.detach(message.owner.id);
                    this._enableParam('position');
                    this._enableParam('rotation');
                    this._enableParam('scale');
                }, tool: tool, topic: 'click' });
            }
        } else {
            this._asset.pointerInteractable.addStateCallback((state) => {
                if(state == InteractableStates.HOVERED) {
                    this._boundingBox.setFromObject(this._object);
                    global.scene.add(this._boundingBoxObj);
                } else {
                    if(state == InteractableStates.SELECTED
                        && this._object == TransformControlsHandler.getObject()
                        && !TransformControlsHandler._isDragging())
                    {
                        TransformControlsHandler.initiateDrag();
                    }
                    global.scene.remove(this._boundingBoxObj);
                }
            });
            this._eventListeners.push({ type: 'pointer', callback: (_) => {
                TransformControlsHandler.detach();
                TransformControlsHandler.attach(this._asset);
            }, tool: InteractionTools.EDIT, topic: 'click' });
        }
    }
    _addActions() {
        if(this._actionsAdded) return;
        for(let details of this._eventListeners) {
            this._asset[details.type + 'Interactable'].addEventListener(
                details.topic, details.callback, { tool: details.tool });
        }
        this._actionsAdded = true;
    }

    _removeActions() {
        if(!this._actionsAdded) return;
        for(let details of this._eventListeners) {
            this._asset[details.type + 'Interactable'].removeEventListener(
                details.topic, details.callback);
        }
        this._attachedPeers = new Set();
        this._actionsAdded = false;
    }

    updateVisualEdit(isVisualEdit) {
        if(isVisualEdit == this._asset._visualEdit) return;
        this._asset._visualEdit = isVisualEdit;
        if(isVisualEdit) {
            if(this._object.parent && this._attachedPeers.size == 0) {
                this._addActions();
            }
        } else {
            this._removeActions();
        }
    }

    attachToPeer(peer, message) {
        this._attachedPeers.add(message.ownerId);
        this._disableParam('position');
        this._disableParam('rotation');
        this._disableParam('scale');
        if(!message.twoHandScaling)
            this._subscribeToPeerDisconnected(peer.id);
        if(message.isXR) {
            if(message.type == 'translate') {
                TranslateHandler.attach(message.ownerId, this._asset,
                    message.position);
            } else if(message.type == 'rotate') {
                RotateHandler.attach(message.ownerId, this._asset,
                    message.rotation);
            } else if(message.type == 'scale') {
                ScaleHandler.attach(message.ownerId, this._asset,
                    message.scale);
            } else {
                TransformControlsHandler.attachToPeer(peer, this._asset,
                    message);
            }
        }
        if(!this._asset.visualEdit) return;

        this._removeActions();
    }

    detachFromPeer(peer, message) {
        this._attachedPeers.delete(message.ownerId);
        if(message.isXR) {
            if(message.type == 'translate') {
                TranslateHandler.detach(message.ownerId,
                    message.position);
            } else if(message.type == 'rotate') {
                RotateHandler.detach(message.ownerId,
                    message.rotation);
            } else if(message.type == 'scale') {
                ScaleHandler.detach(message.ownerId,
                    message.scale);
            } else {
                TransformControlsHandler.detachFromPeer(peer, this._asset,
                    message);
                if(message.twoHandScaling) return;
            }
        }
        this._enableParam('position');
        this._enableParam('rotation');
        this._enableParam('scale');
        this._unsubscribeFromPeerDisconnected(peer.id);
        if(!this._asset.visualEdit) return;

        this._addActions();
    }

    _subscribeToPeerDisconnected(peerId) {
        let lastState = this.getObjectTransformation();
        PubSub.subscribe(this._id, 'PEER_DISCONNECTED:' + peerId, () => {
            for(let param in lastState) {
                this._asset[param] = lastState[param];
            }
            this._asset.addTo(this._asset.parent);
            this._enableParam('position');
            this._enableParam('rotation');
            this._enableParam('scale');
            if(this._asset.visualEdit) this._addActions();
            this._unsubscribeFromPeerDisconnected(peerId);
        });
    }

    _unsubscribeFromPeerDisconnected(peerId) {
        PubSub.unsubscribe(this._id, 'PEER_DISCONNECTED:' + peerId);
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
                    } else {
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
                            if(mtrl.userData['oldMaterial']) {
                                node.material[i] =
                                    mtrl.userData['oldMaterial'];
                                disposeMaterial(mtrl);
                            }
                        }
                    } else {
                        let oldMaterial = node.material;
                        let userData = node.material.userData;
                        if(userData['oldMaterial']) {
                            node.material = userData['oldMaterial'];
                            disposeMaterial(oldMaterial);
                        }
                    }
                }
            }
        });
    }

    getObjectTransformation() {
        return {
            "position": this._object.position.toArray(),
            "rotation": this._object.rotation.toArray(),
            "scale": this._object.scale.toArray(),
        };
    }

    setObjectTransformation(oldValues, newValues, ignorePublish, ignoreUndoRedo,
                            ignoreDisabledCheck){
        let updated = [];
        for(let param of OBJECT_TRANSFORM_PARAMS) {
            if(!this._disabledParams.has(param) || ignoreDisabledCheck || (TransformControlsHandler.getObject() == this._object && !TransformControlsHandler._isDragging())) {
                let oldValue = (oldValues)
                    ? oldValues[param]
                    : this._object[param].toArray();
                let newValue = newValues[param];
                if(oldValue.reduce((a,v,i) => a && newValue[i] == v, true))
                    continue;
                this._object[param].fromArray(newValue);
                this.updateMenuField(param);
                updated.push(param);
            }
        }
        if(updated.length == 0) return;
        if(!ignorePublish)
            this._publish(updated);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.setObjectTransformation(null,oldValues,ignorePublish,true);
            }, () => {
                this.setObjectTransformation(null,newValues,ignorePublish,true);
            });
        }
    }

    roundAttributes(ignorePublish) {
        let updated = [];
        for(let param of OBJECT_TRANSFORM_PARAMS) {
            if(this._object[param].roundWithPrecision(5)) {
                updated.push(param);
                this.updateMenuField(param);
            }
        }
        if(updated.length == 0) return;
        if(!ignorePublish) {
            if(updated.length == 1) {
                this._asset[TRANSFORM_PUBLISH_FUNCTIONS[updated[0]]]();
            } else {
                this._asset.publishTransformation();
            }
        }
    }

    place(intersection) {
        let point = intersection.point;
        this._object.position.copy(this._object.parent.worldToLocal(point));
        this.roundAttributes(true);
    }

    preview() {
        let params = this._asset.exportParams();
        params['visualEdit'] = false;
        delete params['id'];
        let instance = new this._asset.constructor(params);
        instance.makeTranslucent = this.makeTranslucent;
        instance.makeTranslucent();
        return instance;
    }

    _overwriteAssetFunctions() {
        this._asset.onAddToProject = () => this.onAddToProject();
        this._asset._onRemoveFromProject = this._asset.onRemoveFromProject;
        this._asset.onRemoveFromProject = () => {
            this._asset._onRemoveFromProject();
            this.onRemoveFromProject();
        };
        Object.defineProperty(this._asset, 'visualEdit', {
            get: function() { return this._visualEdit; },
            set: (v) => { this.updateVisualEdit(v); },
        });
    }

    _addDeleteSubscriptionForPromotions() {
        let topic = this._asset.constructor.assetType + '_DELETED:'
            + this._asset.assetId + ':' + this._id;
        PubSub.subscribe(this._id, topic, (message) => {
            if(message.asset != this._asset) return;
            this._enableParam('position');
            this._enableParam('rotation');
            this._enableParam('scale');
            let action = message.undoRedoAction;
            if(!action || action.promotionUpdateAdded) return;
            this._promoteChildren(action);
            let undo = action.undo;
            let redo = action.redo;
            action.undo = () => { undo(); this._demoteChildren(action); };
            action.redo = () => { redo(); this._promoteChildren(action); };
            action.promotionUpdateAdded = true;
        });
    }

    _promoteChildren(action) {
        action.promotedChildren = new Set();
        for(let child of this._asset.children) {
            action.promotedChildren.add(child);
        }
        for(let child of action.promotedChildren) {
            child.object.applyMatrix4(this._object.matrix);
            child.addTo(this._asset.parent);
        }
    }

    _demoteChildren(action) {
        let invertedMatrix = this._object.matrix.clone().invert();
        for(let child of action.promotedChildren) {
            if(child.parent == this._asset.parent) {
                child.attachTo(this._asset);
                let childObject = child.object;
                if(!childObject.parent) {
                    childObject.applyMatrix4(invertedMatrix);
                }
            }
        }
    }

    addTo(newParent, ignorePublish, ignoreUndoRedo) {
        let oldParent = this._asset.parent;
        this._asset.addTo(newParent, ignorePublish);
        if(oldParent == newParent) return;
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.addTo(oldParent, ignorePublish, true);
            }, () => {
                this.addTo(newParent, ignorePublish, true);
            });
        }
    }

    attachTo(newParent, ignorePublish, ignoreUndoRedo) {
        let oldParent = this._asset.parent;
        this._asset.attachTo(newParent, ignorePublish);
        if(oldParent == newParent) return;
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.attachTo(oldParent, ignorePublish, true);
            }, () => {
                this.attachTo(newParent, ignorePublish, true);
            });
        }
    }

    onAddToProject() {
        if(!this._asset.visualEdit || this._attachedPeers.size > 0) return;
        this._addActions();
    }

    onRemoveFromProject() {
        this._attachedPeers.clear();
        global.scene.remove(this._boundingBoxObj);
        fullDispose(this._boundingBoxObj);
        this._removeActions();
    }

    static fields = [
        { "parameter": "parentId", "name": "Parent", "includeScene": true,
            "filter": assetFieldFilter, "type": AssetField },
        { "parameter": "position", "name": "Position", "type": Vector3Field },
        { "parameter": "rotation", "name": "Rotation", "type": EulerField },
        { "parameter": "scale", "name": "Scale", "type": Vector3Field },
        { "parameter": "visualEdit", "name": "Visually Edit",
            "type": CheckboxField },
        { "parameter": "renderOrder", "name": "Render Order",
            "type": NumberField },
    ];
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}

EditorHelperFactory.registerEditorHelper(AssetEntityHelper, AssetEntity);
