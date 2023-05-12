/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { AssetEntity, Component, ComponentsHandler, ComponentHelper, EditorHelperFactory, MenuInputs } = window.DigitalBacon;

export default class GrabbableComponent extends Component {
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

    isSupported(asset) {
        return asset instanceof AssetEntity;
    }

    setStealable(stealable) {
        this._stealable = stealable;
    }

    static assetId = 'd9891de1-914d-4448-9e66-8867211b5dc8';
    static assetName = 'Grabbable';
}

ComponentsHandler.registerAsset(GrabbableComponent);

if(EditorHelperFactory && ComponentHelper && MenuInputs) {
    const FIELDS = [
        { "parameter": "stealable", "name": "Stealable",
            "type": MenuInputs.CheckboxInput },
    ];

    class GrabbableComponentHelper extends ComponentHelper {
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

    EditorHelperFactory.registerEditorHelper(GrabbableComponentHelper,
        GrabbableComponent);
}
