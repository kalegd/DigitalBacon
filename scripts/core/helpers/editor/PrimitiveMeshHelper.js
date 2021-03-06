/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import AssetHelper from '/scripts/core/helpers/editor/AssetHelper.js';

export default class PrimitiveMeshHelper extends AssetHelper {
    constructor(asset) {
        super(asset);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        menuFieldsMap['material'] = this._createMaterialInput({
            'parameter': 'material',
            'name': 'Material',
        });
        return menuFieldsMap;
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_DELETED, (e) => {
            if(this._asset.getMaterial() == e.material.getId()) {
                this._updateParameter('material', null, true);
                this.updateMenuField('material');
                if(e.undoRedoAction) {
                    let undo = e.undoRedoAction.undo;
                    e.undoRedoAction.undo = () => {
                        undo();
                        this._updateParameter('material', e.material.getId(),
                            true);
                        this.updateMenuField('material');
                    }
                }
            }
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_DELETED);
    }

    addToScene(scene) {
        super.addToScene(scene);
        this._addSubscriptions();
    }

    removeFromScene() {
        super.removeFromScene();
        this._removeSubscriptions();
    }
}
