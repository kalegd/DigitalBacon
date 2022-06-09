/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Entity from '/scripts/core/assets/Entity.js';
import States from '/scripts/core/enums/InteractableStates.js';
import Hands from '/scripts/core/enums/Hands.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import CopyPasteControlsHandler from '/scripts/core/handlers/CopyPasteControlsHandler.js';
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import Box3Helper from '/scripts/core/helpers/Box3Helper.js';
import { vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { fullDispose, disposeMaterial } from '/scripts/core/helpers/utils.module.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EulerInput from '/scripts/core/menu/input/EulerInput.js';
import Vector3Input from '/scripts/core/menu/input/Vector3Input.js';
import * as THREE from 'three';

const TOOL_AGNOSTIC = "TOOL_AGNOSTIC";
const INTERACTABLE_KEYS = [
    "TOOL_AGNOSTIC",
    HandTools.EDIT,
    HandTools.COPY_PASTE,
    HandTools.DELETE,
];
const OBJECT_TRANSFORM_PARAMS = ['position', 'rotation', 'scale'];
const FIELDS = [
    { "parameter": "position", "name": "Position", "type": Vector3Input },
    { "parameter": "rotation", "name": "Rotation", "type": EulerInput },
    { "parameter": "scale", "name": "Scale", "type": Vector3Input },
    { "parameter": "visualEdit", "name": "Visually Edit",
        "type": CheckboxInput },
];

export default class Asset extends Entity {
    constructor(params = {}) {
        super();
        this._boundingBox = new THREE.Box3();
        this._boundingBoxObj = new Box3Helper(this._boundingBox);
        this._id = params['id'] || this._id;
        this._assetId = params['assetId'];
        this._gripInteractables = {};
        this._pointerInteractables = {};
        for(let key of INTERACTABLE_KEYS) {
            this._pointerInteractables[key] = [];
            this._gripInteractables[key] = [];
        }

        this._name = ('name' in params) ? params['name'] : 'Object';
        let position = (params['position']) ? params['position'] : [0,0,0];
        let rotation = (params['rotation']) ? params['rotation'] : [0,0,0];
        let scale = (params['scale']) ? params['scale'] : [1,1,1];
        this.visualEdit = params['visualEdit'] || false;
        this._object.position.fromArray(position);
        this._object.rotation.fromArray(rotation);
        this._object.scale.fromArray(scale);
        this.roundAttributes(true);

        this._createInteractables();
    }

    _createMesh() {
        console.error("Asset._createMesh() should be overridden");
        return;
    }

    _createInteractables() {
        if(global.deviceType == "XR") {
            let interactable = new GripInteractable(this._object,
                (hand) => {
                    TransformControlsHandler.attach(this, hand);
                }, (hand) => {
                    TransformControlsHandler.detach(hand);
                }
            );
            this._gripInteractables[HandTools.EDIT].push(interactable);
            let deleteInteractable = new GripInteractable(this._object,
                (hand) => {
                    ProjectHandler.deleteAssetInstance(this);
                },
                () => {}
            );
            this._gripInteractables[HandTools.DELETE].push(deleteInteractable);
            deleteInteractable = new PointerInteractable(this._object,
                (hand) => {
                    ProjectHandler.deleteAssetInstance(this);
                },
                true,
                true
            );
            this._pointerInteractables[HandTools.DELETE]
                .push(deleteInteractable);
            let copyInteractable = new GripInteractable(this._object,
                (hand) => {
                    CopyPasteControlsHandler.copy(this);
                },
                () => {},
                Hands.LEFT
            );
            this._gripInteractables[HandTools.COPY_PASTE]
                .push(copyInteractable);
            copyInteractable = new PointerInteractable(this._object,
                (hand) => {
                    CopyPasteControlsHandler.copy(this);
                },
                true,
                true,
                Hands.LEFT
            );
            this._pointerInteractables[HandTools.COPY_PASTE]
                .push(copyInteractable);
        } else {
            this._object.states = States;
            this._object.setState = (state) => {
                if(state == States.HOVERED
                    && this._object != TransformControlsHandler.getObject())
                {
                    this._boundingBox.setFromObject(this._object);
                    global.scene.add(this._boundingBoxObj);
                } else {
                    global.scene.remove(this._boundingBoxObj);
                }
            };
            let interactable = new PointerInteractable(this._object,
                () => {
                    TransformControlsHandler.attach(this);
                },
                true,
                true
            );
            this._pointerInteractables[TOOL_AGNOSTIC].push(interactable);
        }
    }

    _updateVisualEdit(isVisualEdit, ignoreUndoRedo, ignorePublish) {
        if(isVisualEdit == this.visualEdit) return;
        this.visualEdit = isVisualEdit;
        if(isVisualEdit) {
            if(this._object.parent) {
                for(let key of INTERACTABLE_KEYS) {
                    let tool = (key != TOOL_AGNOSTIC) ? key : null;
                    GripInteractableHandler.addInteractables(
                        this._gripInteractables[key], tool);
                    PointerInteractableHandler.addInteractables(
                        this._pointerInteractables[key], tool);
                }
            }
        } else {
            for(let key of INTERACTABLE_KEYS) {
                let tool = (key != TOOL_AGNOSTIC) ? key : null;
                GripInteractableHandler.removeInteractables(
                    this._gripInteractables[key], tool);
                PointerInteractableHandler.removeInteractables(
                    this._pointerInteractables[key], tool);
            }
        }
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._updateVisualEdit(!isVisualEdit, true, ignorePublish);
                this._updateMenuField('visualEdit');
            }, () => {
                this._updateVisualEdit(isVisualEdit, true, ignorePublish);
                this._updateMenuField('visualEdit');
            });
        }
    }

    _updateObjectEuler(param, oldValue, newValue, ignoreUndoRedo,
                       ignorePublish) {
        this._updateObjectVector3(param, oldValue, newValue, ignoreUndoRedo,
            ignorePublish);
    }

    _updateObjectVector3(param, oldValue, newValue, ignoreUndoRedo,
                         ignorePublish) {
        let currentValue = this._object[param].toArray();
        if(!currentValue.reduce((a, v, i) => a && newValue[i] == v, true)) {
            this._object[param].fromArray(newValue);
            if(!ignorePublish)
                PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        }
        if(!ignoreUndoRedo && !oldValue
                .reduce((a,v,i) => a && newValue[i] == v,true))
        {
            UndoRedoHandler.addAction(() => {
                this._updateObjectVector3(param, null, oldValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateObjectVector3(param, null, newValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            });
        }
    }

    _updateMenuField(param) {
        if(!this._menuFields) return;
        let menuField = this._menuFieldsMap[param];
        if(menuField) menuField.updateFromSource();
    }

    getObjectTransformation() {
        return {
            "position": this._object.position.toArray(),
            "rotation": this._object.rotation.toArray(),
            "scale": this._object.scale.toArray(),
        };
    }

    setObjectTransformation(oldValues, newValues, ignoreUndoRedo,
                            ignorePublish) {
        let updated = [];
        for(let param of OBJECT_TRANSFORM_PARAMS) {
            let oldValue = (oldValues)
                ? oldValues[param]
                : this._object[param].toArray();
            let newValue = newValues[param];
            if(oldValue.reduce((a,v,i) => a && newValue[i] == v,true)) continue;
            this._object[param].fromArray(newValue);
            this._updateMenuField(param);
            updated.push(param);
        }
        if(updated.length == 0) return;
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.setObjectTransformation(null, oldValues, true,
                    ignorePublish);
            }, () => {
                this.setObjectTransformation(null, newValues, true,
                    ignorePublish);
            });
        }
    }

    roundAttributes(ignorePublish) {
        let updated = [];
        for(let param of OBJECT_TRANSFORM_PARAMS) {
            if(this._object[param].roundWithPrecision(5)) {
                updated.push(param);
                this._updateMenuField(param);
            }
        }
        if(updated.length == 0) return;
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
    }

    makeTranslucent() {
        this._object.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                if (node.material) {
                    if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                        node.material.materials.forEach(function (mtrl, idx) {
                            let newMaterial = mtrl.clone();
                            makeMaterialTranslucent(newMaterial);
                            newMaterial.userData['oldMaterial'] = mtrl;
                            node.material.materials[idx] = newMaterial;
                        });
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
                    if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                        node.material.materials.forEach(function (mtrl, idx) {
                            node.material.materials[idx] =
                                mtrl.userData['oldMaterial'];
                            disposeMaterial(mtrl);
                        });
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
            "position": this._object.position.toArray(),
            "rotation": this._object.rotation.toArray(),
            "scale": this._object.scale.toArray(),
            "visualEdit": this.visualEdit,
        };
    }

    getMenuFields(fields) {
        if(this._menuFields) return this._menuFields;

        this._menuFieldsMap = this._getMenuFieldsMap();
        let menuFields = [];
        for(let field of fields) {
            if(field.parameter in this._menuFieldsMap) {
                menuFields.push(this._menuFieldsMap[field.parameter]);
            }
        }
        this._menuFields = menuFields;
        return menuFields;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = {};
        for(let field of FIELDS) {
            let params = {};
            params['title'] = field.name;
            if(field.type == CheckboxInput) {
                params['initialValue'] = this.visualEdit;
                params['getFromSource'] =
                    () => { return this.visualEdit; };
                params['onUpdate'] = (v) => { this._updateVisualEdit(v); };
            } else if(field.type == EulerInput) {
                params['euler'] = this._object[field.parameter];
                params['onBlur'] = (oldValue, newValue) => {
                    this._updateObjectEuler(field.parameter, oldValue,newValue);
                };
                params['onUpdate'] = (newValue) => {
                    this._updateObjectEuler(field.parameter,
                        this._object[field.parameter].toArray(), newValue,true);
                };
            } else if(field.type == Vector3Input) {
                params['vector3'] = this._object[field.parameter];
                params['onBlur'] = (oldValue, newValue) => {
                    this._updateObjectVector3(field.parameter, oldValue,
                        newValue);
                };
                params['onUpdate'] = (newValue) => {
                    this._updateObjectVector3(field.parameter,
                        this._object[field.parameter].toArray(), newValue,true);
                };
            }
            let menuField = new field.type(params)
            menuFieldsMap[field.parameter] = menuField;
        }
        return menuFieldsMap;
    }

    place(intersection) {
        let point = intersection.point;
        this._object.position.copy(point);
        this.roundAttributes(true);
    }

    addToScene(scene) {
        scene.add(this._object);
        if(!this.visualEdit) return;
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.addInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.addInteractables(
                this._pointerInteractables[key], tool);
        }
    }

    removeFromScene() {
        this._object.parent.remove(this._object);
        global.scene.remove(this._boundingBoxObj);
        fullDispose(this._object);
        fullDispose(this._boundingBoxObj);
        for(let key of INTERACTABLE_KEYS) {
            let tool = (key != TOOL_AGNOSTIC) ? key : null;
            GripInteractableHandler.removeInteractables(
                this._gripInteractables[key], tool);
            PointerInteractableHandler.removeInteractables(
                this._pointerInteractables[key], tool);
        }
    }

    getId() {
        return this._id;
    }

    getAssetId() {
        return this._assetId;
    }

    getName() {
        return this._name;
    }

    setName(newName, isUndoRedo) {
        if(newName == null || this._name == newName) return;
        let oldName = this._name;
        this._name = newName;
        PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        if(!isUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.setName(oldName, true);
            }, () => {
                this.setName(newName, true);
            });
        }
    }
}

function makeMaterialTranslucent(material) {
    material.opacity = 0.5;
    material.transparent = true;
}
