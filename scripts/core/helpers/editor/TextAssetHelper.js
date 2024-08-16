/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import TextAsset from '/scripts/core/assets/texts/TextAsset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';

const { ColorField, EnumField, NumberField, TextField } = AssetEntityHelper.FieldTypes;

export default class TextAssetHelper extends AssetEntityHelper {
    constructor(asset) {
        super(asset, PubSubTopics.TEXT_UPDATED);
    }

    place(intersection) {
        let { object, point } = intersection;
        object.updateMatrixWorld();
        let normal = intersection.face.normal.clone()
            .transformDirection(object.matrixWorld).clampLength(0, 0.001);
        if(global.camera.getWorldDirection(vector3s[0]).dot(normal) > 0)
            normal.negate();
        point.add(normal);
        this._object.position.copy(point);
        this._object.parent.worldToLocal(this._object.position);
        point.add(normal);
        this._object.lookAt(point);
        this.roundAttributes(true);
    }

    static fields = [
        { "parameter": "text", "name": "Text", "type": TextField },
        { "parameter": "fontSize", "name": "Font Size", "min": 0,
            "type": NumberField },
        { "parameter": "fontColor", "name": "Font Color",
            "type": ColorField },
        { "parameter": "textAlign", "name": "Text Alignment",
            "map": { "Left": "left", "Center": "center", "Right": "right" },
            "type": EnumField },
    ];
}

EditorHelperFactory.registerEditorHelper(TextAssetHelper, TextAsset);
