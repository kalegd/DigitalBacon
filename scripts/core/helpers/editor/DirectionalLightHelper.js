/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import DirectionalLight from '/scripts/core/assets/primitives/DirectionalLight.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import LightHelper from '/scripts/core/helpers/editor/LightHelper.js';

const { Vector3Field } = LightHelper.FieldTypes;

export default class DirectionalLightHelper extends LightHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "intensity" },
        { "parameter": "color" },
        { "parameter": "direction", "name": "Direction", "type": Vector3Field },
    ];
}

EditorHelperFactory.registerEditorHelper(DirectionalLightHelper,
    DirectionalLight);
