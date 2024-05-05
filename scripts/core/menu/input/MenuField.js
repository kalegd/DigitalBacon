/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Styles } from '/scripts/core/helpers/constants.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { Span, Style, Text } from '/scripts/DigitalBacon-UI.js';


const SPAN_STYLE = new Style({
    justifyContent: 'spaceBetween',
    minHeight: 0.05,
    width: 0.31,
});

class MenuField extends Span {
    constructor(params = {}) {
        super(SPAN_STYLE);
        this._id = uuidv4();
        this._disabled = false;
        this._getFromSource = params['getFromSource'];
        this._onUpdate = params['onUpdate'];
    }

    _addTitle(title, maxWidth = 0.13) {
        let titleBlock = new Text(title, Styles.bodyText, {
            maxWidth: maxWidth,
        });
        this.add(titleBlock);
        return titleBlock;
    }

    deactivate() {}
    updateFromSource() {}

    get disabled() { return this._disabled; }
    set disabled(disabled) { this._disabled = disabled; }
}

export default MenuField;
