/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, EditorHelpers, ProjectHandler, MenuInputs }=window.DigitalBacon;
const { AssetEntity, Component } = Assets;
const { ComponentHelper, EditorHelperFactory } = EditorHelpers;

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

    supports(asset) {
        return asset instanceof AssetEntity;
    }

    setStealable(stealable) {
        this._stealable = stealable;
    }

    static assetId = 'd9891de1-914d-4448-9e66-8867211b5dc8';
    static assetName = 'Grabbable';
}

ProjectHandler.registerAsset(GrabbableComponent);

if(EditorHelpers) {
    class GrabbableComponentHelper extends ComponentHelper {
        constructor(asset) {
            super(asset);
        }

        static fields = [
            { "parameter": "stealable", "name": "Stealable",
                "type": MenuInputs.CheckboxInput },
        ];
    }

    EditorHelperFactory.registerEditorHelper(GrabbableComponentHelper,
        GrabbableComponent);
}
