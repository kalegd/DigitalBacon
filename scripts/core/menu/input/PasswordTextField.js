/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import TextField from '/scripts/core/menu/input/TextField.js';

class PasswordTextField extends TextField {
    constructor(params) {
        super(params);
    }

    _updateDisplayedContent(addPipe) {
        let newContent = "*".repeat(this.content.length);
        let textComponent = this._object.children[1];
        if(this._maxLength && newContent.length > this._maxLength) {
            newContent = "..." + newContent.substring(
                newContent.length - this._maxLength);
        }
        if(addPipe) newContent += "|";
        textComponent.set({ content: newContent });
    }

}

export default PasswordTextField;
