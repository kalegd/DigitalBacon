/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import Component from '/scripts/core/assets/components/Component.js';
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import GrabbableComponentHelper from '/scripts/core/helpers/editor/GrabbableComponentHelper.js';

const COMPONENT_TYPE_ID = 'c07025cf-776a-4f4e-9201-edfd2ce7be50';
const NAME = 'Grabbable';

export default class GrabbableComponent extends Component {
    constructor(params = {}) {
        super(params);
        this._componentTypeId = COMPONENT_TYPE_ID;
        this._stealable = params['stealable'] == true;
    }

    _createEditorHelper() {
        this._editorHelper = new GrabbableComponentHelper(this);
    }

    _getDefaultName() {
        return NAME;
    }

    getStealable() {
        return this._stealable;
    }

    isSupported(asset) {
        return asset instanceof Asset;
    }

    setStealable(stealable) {
        this._stealable = stealable;
    }

    static getComponentTypeId() {
        return COMPONENT_TYPE_ID;
    }

    static getName() {
        return NAME;
    }
}

ComponentsHandler.registerComponent(GrabbableComponent, COMPONENT_TYPE_ID);
