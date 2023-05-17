/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, AssetHandlers, EditorHelpers, MenuInputs } =window.DigitalBacon;

export default class GrabbableComponent extends Assets.Component {
    constructor(params = {}) {
        params['assetId'] = GrabbableComponent.assetId;
        super(params);
        this._stealable = params['stealable'] == true;
    }

    _getDefaultName() {
        return GrabbableComponent.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['stealable'] = this._stealable;
        return params;
    }

    getStealable() {
        return this._stealable;
    }

    supports(asset) {
        return asset instanceof Assets.AssetEntity;
    }

    setStealable(stealable) {
        this._stealable = stealable;
    }

    static assetId = 'd9891de1-914d-4448-9e66-8867211b5dc8';
    static assetName = 'Grabbable';
}

AssetHandlers.ComponentsHandler.registerAsset(GrabbableComponent);

if(EditorHelpers) {
    const FIELDS = [
        { "parameter": "stealable", "name": "Stealable",
            "type": MenuInputs.CheckboxInput },
    ];

    class GrabbableComponentHelper extends EditorHelpers.ComponentHelper {
        constructor(asset) {
            super(asset);
        }

        getMenuFields() {
            return super.getMenuFields(FIELDS);
        }

        _getMenuFieldsMap() {
            let menuFieldsMap = super._getMenuFieldsMap();
            for(let field of FIELDS) {
                if(field.parameter in menuFieldsMap) {
                    continue;
                } else {
                    let input = this._createStandardInput(field);
                    if(input) menuFieldsMap[field.parameter] = input;
                }
            }
            return menuFieldsMap;
        }
    }

    EditorHelpers.EditorHelperFactory.registerEditorHelper(
        GrabbableComponentHelper, GrabbableComponent);
}
