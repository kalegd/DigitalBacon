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
import { Materials } from '/scripts/core/helpers/constants.js';
import MaterialInput from '/scripts/core/menu/input/MaterialInput.js';
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

    _updateMaterial(materialId) {
        if(materialId == this._material) return;
        let wasTranslucent = this._mesh.material.userData['oldMaterial'];
        if(wasTranslucent) this.returnTransparency();

        this._material = materialId;
        let oldMaterial = this._mesh.material;
        let material = this._getMaterial();
        this._mesh.material = material;
        oldMaterial.dispose();

        if(wasTranslucent) this.makeTranslucent();
        PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
    }

    clone(enableInteractablesOverride) {
        let params = this._fetchCloneParams(enableInteractablesOverride);
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
        menuFieldsMap['Material'] = new MaterialInput({
            'title': 'Material',
            'initialValue': this._material,
            'getFromSource': () => { return this._material; },
            'setToSource': (v) => { this._updateMaterial(v); },
        });
        return menuFieldsMap;
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_DELETED, (e) => {
            if(this._material == e.material.getId()) {
                this._updateMaterial(null);
                if(e.undoRedoAction) {
                    let undo = e.undoRedoAction.undo;
                    e.undoRedoAction.undo = () => {
                        undo();
                        this._updateMaterial(e.material.getId());
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
