/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Shape from '/scripts/core/assets/primitives/Shape.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

const { MaterialField } = AssetEntityHelper.FieldTypes;

export default class ShapeHelper extends AssetEntityHelper {
    constructor(asset) {
        super(asset, PubSubTopics.SHAPE_UPDATED);
        this._overwriteSetMaterial();
    }

    _overwriteSetMaterial() {
        Object.defineProperty(this._asset, 'materialId', {
            get: function() { return this._materialId; },
            set: (newValue) => {
                let mesh = this._asset.mesh;
                let wasTranslucent = mesh.material.userData['oldMaterial'];
                if(wasTranslucent) this.returnTransparency();
                this._asset._materialId = newValue;
                let oldMaterial = this._asset._mesh.material;
                let material = this._asset._getMaterial();
                this._asset._mesh.material = material;
                oldMaterial.dispose();
                if(wasTranslucent) this.makeTranslucent();
            },
        });
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_DELETED, (e) => {
            if(this._asset.materialId == e.asset.id) {
                this._updateParameter('materialId', null, false, true);
                this.updateMenuField('materialId');
                if(e.undoRedoAction) {
                    let undo = e.undoRedoAction.undo;
                    e.undoRedoAction.undo = () => {
                        undo();
                        this._updateParameter('materialId', e.asset.id,
                            false, true);
                        this.updateMenuField('materialId');
                    };
                }
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_ADDED, (e) => {
            if(this._asset.materialId == e.id) {
                this._asset.materialId = e.id;
            }
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_DELETED);
    }

    onAddToProject(scene) {
        super.onAddToProject();
        this._addSubscriptions();
    }

    onRemoveFromProject() {
        super.onRemoveFromProject();
        this._removeSubscriptions();
    }

    static fields = [
        { 'parameter': 'materialId', 'name': 'Material', "type": MaterialField }
    ];
}

EditorHelperFactory.registerEditorHelper(ShapeHelper, Shape);
