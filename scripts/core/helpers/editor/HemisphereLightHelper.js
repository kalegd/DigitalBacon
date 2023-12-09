/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import HemisphereLight from '/scripts/core/assets/primitives/HemisphereLight.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import LightHelper from '/scripts/core/helpers/editor/LightHelper.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';

export default class HemisphereLightHelper extends LightHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "intensity" },
        { "parameter": "color" },
        { "parameter": "groundColor", "name": "Ground Color","type":ColorInput},
    ];
}

EditorHelperFactory.registerEditorHelper(HemisphereLightHelper,
    HemisphereLight);
