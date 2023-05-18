/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Light from '/scripts/core/assets/primitives/Light.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';

export default class LightHelper extends AssetEntityHelper {
    constructor(asset) {
        super(asset, PubSubTopics.LIGHT_UPDATED);
        this._createMesh();
    }

    _createMesh() {
        console.error(
            "LightHelper._createMesh() should be overridden");
        return;
    }

    updateVisualEdit(isVisualEdit) {
        if(isVisualEdit) {
            this._object.add(this._mesh);
        } else {
            this._object.remove(this._mesh);
            fullDispose(this._mesh);
        }
        super.updateVisualEdit(isVisualEdit);
    }

    static fields = [
        { "parameter": "visualEdit" },
        { "parameter": "intensity", "name": "Intensity", "min": 0,
            "type": NumberInput },
        { "parameter": "color", "name": "Color", "type": ColorInput },
        { "parameter": "position" },
        { "parameter": "rotation" },
        { "parameter": "scale" },
    ];
}

EditorHelperFactory.registerEditorHelper(LightHelper, Light);
