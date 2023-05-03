/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import Component from '/scripts/core/assets/components/Component.js';
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';

export default class GrabbableComponent extends Component {
    constructor(params = {}) {
        super(params);
        this._assetId = GrabbableComponent.assetId;
        this._stealable = params['stealable'] == true;
    }

    _getDefaultName() {
        return GrabbableComponent.assetName;
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

ComponentsHandler.registerComponent(GrabbableComponent);
