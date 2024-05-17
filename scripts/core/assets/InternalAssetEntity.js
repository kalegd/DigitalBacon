/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';

export default class InternalAssetEntity extends AssetEntity {
    constructor(params = {}) {
        super(params);
    }

    onRemoveFromProject() {
        let inheritor = this.parent;
        while(inheritor.constructor.assetType == AssetTypes.INTERNAL) {
            inheritor = inheritor.parent;
        }
        this.promoteExternalAssets(inheritor, this.children);
        super.onRemoveFromProject();
    }

    promoteExternalAssets(inheritor, children) {
        for(let child of children) {
            if(child.constructor.assetType == AssetTypes.INTERNAL) {
                this.promoteExternalAssets(inheritor, child.children);
            } else {
                child.attachTo(inheritor, true);
            }
        }
    }

    static assetType = AssetTypes.INTERNAL;
}
