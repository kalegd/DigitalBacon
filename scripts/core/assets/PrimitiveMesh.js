/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Materials } from '/scripts/core/helpers/constants.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import MaterialInput from '/scripts/core/menu/input/MaterialInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

export default class PrimitiveMesh extends Asset {
    constructor(params = {}) {
        super(params);
        this._material = params['material'];
        this._addSubscriptions();
    }

    _getMaterial() {
        if(this._material) {
            return MaterialsHandler.getMaterial(this._material).getMaterial();
        } else {
            return Materials.defaultMeshMaterial;
        }
    }

    _updateMaterial(newValue, ignoreUndoRedo, ignorePublish) {
        let oldValue = this._material;
        if(oldValue == newValue) return;
        let wasTranslucent = this._mesh.material.userData['oldMaterial'];
        if(wasTranslucent) this.returnTransparency();

        this._material = newValue;
        let oldMaterial = this._mesh.material;
        let material = this._getMaterial();
        this._mesh.material = material;
        oldMaterial.dispose();

        if(wasTranslucent) this.makeTranslucent();
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._updateMaterial(oldValue, true, ignorePublish);
            }, () => {
                this._updateMaterial(newValue, true, ignorePublish);
            });
        }
    }

    _updateGeometryParameter(param, oldValue, newValue, ignoreUndoRedo, ignorePublish) {
        let currentValue = this['_' + param];
        if(currentValue != newValue) {
            this['_' + param] = newValue;
            this._updateGeometry();
            if(!ignorePublish)
                PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        }
        if(!ignoreUndoRedo && oldValue != newValue) {
            UndoRedoHandler.addAction(() => {
                this._updateGeometryParameter(param, null, oldValue, true,
                    ignorePublish);
            }, () => {
                this._updateGeometryParameter(param, null, newValue, true,
                    ignorePublish);
            });
        }
    }

    _updateGeometry() {
        console.error("PrimitiveMesh._updateGeometry() should be overridden");
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        let instance = new this.constructor(params);
        return ProjectHandler.addPrimitive(instance);
    }

    exportParams() {
        let params = super.exportParams();
        params['material'] = this._material;
        return params;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        menuFieldsMap['material'] = new MaterialInput({
            'title': 'Material',
            'initialValue': this._material,
            'getFromSource': () => { return this._material; },
            'onUpdate': (v) => { this._updateMaterial(v); },
        });
        return menuFieldsMap;
    }

    _createGeometryCheckboxInput(field) {
        return new CheckboxInput({
            'title': field.name,
            'initialValue': this['_' + field.parameter],
            'onUpdate': (newValue) => {
                this._updateGeometryParameter(field.parameter,
                    this['_' + field.parameter], newValue);
            },
            'getFromSource': () => { return this['_' + field.parameter]; },
        });
    }

    _createGeometryNumberInput(field) {
        return new NumberInput({
            'title': field.name,
            'minValue': field.min,
            'maxValue': field.max,
            'initialValue': this['_' + field.parameter],
            'onBlur': (oldValue, newValue) => {
                this._updateGeometryParameter(field.parameter, oldValue,
                    newValue);
            },
            'onUpdate': (newValue) => {
                this._updateGeometryParameter(field.parameter,
                    this['_' + field.parameter], newValue, true);
            },
            'getFromSource': () => { return this['_' + field.parameter]; },
        });
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_DELETED, (e) => {
            if(this._material == e.material.getId()) {
                this._updateMaterial(null, true);
                if(e.undoRedoAction) {
                    let undo = e.undoRedoAction.undo;
                    e.undoRedoAction.undo = () => {
                        undo();
                        this._updateMaterial(e.material.getId(), true);
                    }
                }
            }
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_DELETED);
    }

    dispose() {
        this._removeSubscriptions();
        super.dispose();
    }

}
