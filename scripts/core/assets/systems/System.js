/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class System {
    constructor(params = {}) {
        this._id = params['id'] || uuidv4();
        this._disabled = params['disabled'] || false;
        this._name = params['name'] || this._getDefaultName();
        if(global.isEditor) this._createEditorHelper();
    }

    _createEditorHelper() {
        console.error("Texture._createEditorHelper() should be overridden");
        return;
    }

    _getDefaultName() {
        console.error("Component.getDefaultName() should be overridden");
        return '';
    }

    getId() {
        return this._id;
    }

    getDescription() {
        console.error("System.getDescription() should be overridden");
        return '';
    }

    getDisabled() {
        return this._disabled;
    }

    getEditorHelper() {
        return this._editorHelper;
    }

    getName() {
        return this._name;
    }

    getSystemTypeId() {
        return this._systemTypeId;
    }

    setDisabled(disabled) {
        this._disabled = disabled;
    }

    setName(name) {
        if(name == null || this._name == name) return;
        this._name = name;
    }

    needsUpdates() {
        return false;
    }
}
