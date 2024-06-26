/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Material from '/scripts/core/assets/materials/Material.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { SIDE_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

const { CheckboxField, EnumField, NumberField } = EditorHelper.FieldTypes;

export default class MaterialHelper extends EditorHelper {
    constructor(asset) {
        super(asset, PubSubTopics.MATERIAL_UPDATED);
    }

    _addSubscriptions() {
        let maps = this._asset.getMaps();
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_DELETED, (e) => {
            let updatedMaps = [];
            for(let map of maps) {
                if(this._asset[map + 'Id'] == e.asset.id) {
                    this._updateParameter(map + 'Id', null, false, true);
                    this.updateMenuField(map + 'Id');
                    updatedMaps.push(map);
                }
            }
            if(e.undoRedoAction && updatedMaps.length > 0) {
                let undo = e.undoRedoAction.undo;
                e.undoRedoAction.undo = () => {
                    undo();
                    for(let map of updatedMaps) {
                        this._updateParameter(map + 'Id',e.asset.id,false,true);
                        this.updateMenuField(map + 'Id');
                    }
                };
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_UPDATED, (message) => {
            let textureId = message.asset.id;
            this._updateMapIfUsed(textureId, maps);
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_ADDED, (message) => {
            let textureId = message.id;
            this._updateMapIfUsed(textureId, maps);
        });
    }

    _updateMapIfUsed(textureId, maps) {
        for(let map of maps) {
            if(this._asset[map + 'Id'] == textureId) {
                this._asset._setTexture(map, textureId);
                this.updateMenuField(map + 'Id');
            }
        }
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_UPDATED);
    }

    dispose() {
        this._removeSubscriptions();
    }

    undoDispose() {
        this._addSubscriptions();
    }

    static fields = [
        { "parameter": "transparent", "name": "Transparent",
            "type": CheckboxField },
        { "parameter": "opacity", "name": "Opacity", "min": 0, "max": 1,
            "type": NumberField },
        { "parameter": "side", "name": "Display", "map": SIDE_MAP,
            "type": EnumField },
    ];
}

EditorHelperFactory.registerEditorHelper(MaterialHelper, Material);
