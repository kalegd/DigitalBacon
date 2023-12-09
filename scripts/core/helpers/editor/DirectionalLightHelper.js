/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import DirectionalLight from '/scripts/core/assets/primitives/DirectionalLight.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import LightHelper from '/scripts/core/helpers/editor/LightHelper.js';
import Vector3Input from '/scripts/core/menu/input/Vector3Input.js';

export default class DirectionalLightHelper extends LightHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "intensity" },
        { "parameter": "color" },
        { "parameter": "direction", "name": "Direction", "type": Vector3Input },
    ];
}

EditorHelperFactory.registerEditorHelper(DirectionalLightHelper,
    DirectionalLight);
