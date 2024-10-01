/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuField from '/scripts/core/menu/input/MenuField.js';
import { createWideButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';

class ButtonField extends MenuField {
    constructor(params) {
        super(params);
        this.justifyContent = 'center';
        let title = params['title'] || 'Missing Field Name...';
        this._onClick = params['onClick'];
        this._createInputs(title);
    }

    _createInputs(title) {
        let assetSetButton = createWideButton(title);
        assetSetButton.textComponent.fontSize = 0.017;
        assetSetButton.height = 0.03;
        assetSetButton.width = 0.25;
        this.add(assetSetButton);
        assetSetButton.onClickAndTouch = () => {
            if(this._onClick) this._onClick();
        };
    }

    updateFromSource() {}
}

export default ButtonField;
