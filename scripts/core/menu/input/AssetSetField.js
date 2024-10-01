/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import MenuField from '/scripts/core/menu/input/MenuField.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';

class AssetSetField extends MenuField {
    constructor(params) {
        super(params);
        this._lastValue =  params['initialValue'];
        let title = params['title'] || 'Missing Field Name...';
        this._getOptions = params['getOptions'];
        this._getNewOptions = params['getNewOptions'];
        this._onAdd = params['onAdd'];
        this._onRemove = params['onRemove'];
        this._createInputs(title);
    }

    _createInputs(title) {
        this._addTitle(title);
        let assetSetButton = createWideButton('Update');
        assetSetButton.textComponent.fontSize = 0.017;
        assetSetButton.height = 0.03;
        assetSetButton.width = 0.17;
        this.add(assetSetButton);
        assetSetButton.onClickAndTouch = () => {
            let options = this._getOptions ? this._getOptions() : [];
            let newOptions = this._getNewOptions ? this._getNewOptions() : [];
            let page = global.menuController.getPage(MenuPages.ASSET_SET);
            page.setContent(title, this._getFromSource, options, newOptions,
                this._onAdd, this._onRemove);
            global.menuController.pushPage(MenuPages.ASSET_SET);
        };
    }

    updateFromSource() {
        if(!this._getFromSource) return;
        let newValue = this._getFromSource();
        if(newValue != this._lastValue) this._lastValue = newValue;
    }
}

export default AssetSetField;
