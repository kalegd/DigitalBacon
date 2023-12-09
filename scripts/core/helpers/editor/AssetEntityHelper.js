/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import States from '/scripts/core/enums/InteractableStates.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import CopyPasteControlsHandler from '/scripts/core/handlers/CopyPasteControlsHandler.js';
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
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
import AssetEntityInput from '/scripts/core/menu/input/AssetEntityInput.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EulerInput from '/scripts/core/menu/input/EulerInput.js';
import Vector3Input from '/scripts/core/menu/input/Vector3Input.js';
import * as THREE from 'three';

const OBJECT_TRANSFORM_PARAMS = ['position', 'rotation', 'scale'];
const TRANSFORM_PUBLISH_FUNCTIONS = {
    position: 'publishPosition',
    rotation: 'publishRotation',
    scale: 'publishScale',
};
const TRS_HANDLERS = [{ handler: TranslateHandler, tool: HandTools.TRANSLATE },
                      { handler: RotateHandler, tool: HandTools.ROTATE },
                      { handler: ScaleHandler, tool: HandTools.SCALE },
];

export default class AssetEntityHelper extends EditorHelper {
    constructor(asset, updatedTopic) {
        super(asset, updatedTopic);
        this._object = asset.getObject();
        this._attachedPeers = new Set();
        this._gripActions = [];
        this._pointerActions = [];
        this._boundingBox = new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
        this._overwriteAssetFunctions();
        this._addDeleteSubscriptionForPromotions();
    }

    _addActions() {
        if(this._pointerActions.length > 0) return;
        if(global.deviceType == "XR") {
            this._gripActions.push(
                this._asset.addGripAction((ownerId) => {
                    TransformControlsHandler.attach(this._asset, ownerId);
                }, (ownerId) => {
                    TransformControlsHandler.detach(ownerId);
                }, HandTools.EDIT));
            this._gripActions.push(
                this._asset.addGripAction(() => {
                    ProjectHandler.deleteAsset(this._asset);
                }, null, HandTools.DELETE));
            this._pointerActions.push(
                this._asset.addPointerAction(() => {
                    ProjectHandler.deleteAsset(this._asset);
                }, null, null, HandTools.DELETE));
            this._pointerActions.push(
                this._asset.addPointerAction((ownerId) => {
                    CopyPasteControlsHandler.copy(ownerId, this._asset);
                }, null, null, HandTools.COPY_PASTE));
            for(let handlerDetails of TRS_HANDLERS) {
                let handler = handlerDetails.handler;
                let tool = handlerDetails.tool;
                this._gripActions.push(
                    this._asset.addGripAction((ownerId) => {
                        handler.attach(ownerId, this._asset);
                    }, (ownerId) => {
                        handler.detach(ownerId);
                    }, tool));
            }
        } else {
            this._object.states = States;
            this._object.setState = (state) => {
                if(state == States.HOVERED) {
                    this._boundingBox.setFromObject(this._object);
                    global.scene.add(this._boundingBoxObj);
                } else {
                    if(state == States.SELECTED
                        && this._object == TransformControlsHandler.getObject()
                        && !TransformControlsHandler._isDragging())
                    {
                        TransformControlsHandler.initiateDrag();
                    }
                    global.scene.remove(this._boundingBoxObj);
                }
            };
            this._pointerActions.push(
                this._asset.addPointerAction(() => {
                    TransformControlsHandler.attach(this._asset);
                }));
        }
    }

    _removeActions() {
        for(let action of this._gripActions) {
            this._asset.removeGripAction(action.id);
        }
        this._gripActions = [];
        for(let action of this._pointerActions) {
            this._asset.removePointerAction(action.id);
        }
        this._pointerActions = [];
        this._attachedPeers = new Set();
    }

    updateVisualEdit(isVisualEdit) {
        if(isVisualEdit == this._asset.visualEdit) return;
        this._asset.visualEdit = isVisualEdit;
        if(isVisualEdit) {
            if(this._object.parent && this._attachedPeers.size == 0) {
                this._addActions();
            }
        } else {
            this._removeActions();
        }
    }

    attachToPeer(peer, message) {
        this._attachedPeers.add(message.option);
        if(message.isXR) {
            if(message.type == 'translate') {
                TranslateHandler.attach(message.option, this._asset,
                    message.position);
            } else if(message.type == 'rotate') {
                RotateHandler.attach(message.option, this._asset,
                    message.rotation);
            } else if(message.type == 'scale') {
                ScaleHandler.attach(message.option, this._asset,
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
        this._attachedPeers.delete(message.option);
        if(message.isXR) {
            if(message.type == 'translate') {
                TranslateHandler.detach(message.option,
                    message.position);
            } else if(message.type == 'rotate') {
                RotateHandler.detach(message.option,
                    message.rotation);
            } else if(message.type == 'scale') {
                ScaleHandler.detach(message.option,
                    message.scale);
            } else {
                TransformControlsHandler.detachFromPeer(peer, this._asset,
                    message);
                if(message.twoHandScaling) return;
            }
        }
        if(!this._asset.visualEdit) return;

        this._addActions();
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

    setObjectTransformation(oldValues, newValues, ignorePublish,ignoreUndoRedo){
        let updated = [];
        for(let param of OBJECT_TRANSFORM_PARAMS) {
            let oldValue = (oldValues)
                ? oldValues[param]
                : this._object[param].toArray();
            let newValue = newValues[param];
            if(oldValue.reduce((a,v,i) => a && newValue[i] == v,true)) continue;
            this._object[param].fromArray(newValue);
            this.updateMenuField(param);
            updated.push(param);
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
        this._object.position.copy(point);
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
        this._asset._addToScene = this._asset.addToScene;
        this._asset._removeFromScene = this._asset.removeFromScene;
        this._asset.addToScene =
            (scene, pointerInteractable, gripInteractable) => {
                this._asset._addToScene(scene, pointerInteractable,
                    gripInteractable);
                this.addToScene();
            };
        this._asset.removeFromScene = () => {
            this._asset._removeFromScene();
            this.removeFromScene();
        };
        this._asset.setVisualEdit = (visualEdit) => {
            this.updateVisualEdit(visualEdit);
        };
    }

    _addDeleteSubscriptionForPromotions() {
        let topic = this._asset.constructor.assetType + '_DELETED:'
            + this._asset.getAssetId();
        PubSub.subscribe(this._id, topic, (message) => {
            if(message.asset != this._asset) return;
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
            child.getObject().applyMatrix4(this._object.matrix);
            child.addTo(this._asset.parent);
        }
    }

    _demoteChildren(action) {
        let invertedMatrix = this._object.matrix.clone().invert();
        for(let child of action.promotedChildren) {
            if(child.parent == this._asset.parent) {
                child.attachTo(this._asset);
                let childObject = child.getObject();
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

    addToScene() {
        if(!this._asset.visualEdit || this._attachedPeers.size > 0) return;
        this._addActions();
    }

    removeFromScene() {
        this._attachedPeers.clear();
        global.scene.remove(this._boundingBoxObj);
        fullDispose(this._boundingBoxObj);
        this._removeActions();
    }

    static fields = [
        { "parameter": "parentId", "name": "Parent", "includeScene": true,
            "excludeSelf": true, "type": AssetEntityInput },
        { "parameter": "position", "name": "Position", "type": Vector3Input },
        { "parameter": "rotation", "name": "Rotation", "type": EulerInput },
        { "parameter": "scale", "name": "Scale", "type": Vector3Input },
        { "parameter": "visualEdit", "name": "Visually Edit",
            "type": CheckboxInput },
    ];
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}

EditorHelperFactory.registerEditorHelper(AssetEntityHelper, AssetEntity);
