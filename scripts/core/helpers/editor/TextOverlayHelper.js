/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import TextOverlay from '/scripts/core/assets/texts/TextOverlay.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import TextAssetHelper from '/scripts/core/helpers/editor/TextAssetHelper.js';

const { ColorField, EnumField, NumberField } = TextAssetHelper.FieldTypes;

export default class TextOverlayHelper extends TextAssetHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "visualEdit",
        "text",
        "fontSize",
        { "parameter": "width", "name": "Width", "min": 0,
            "type": NumberField },
        { "parameter": "height", "name": "Height", "min": 0,
            "type": NumberField },
        "fontColor",
        { "parameter": "backgroundColor", "name": "Background Color",
            "type": ColorField },
        { "parameter": "backgroundOpacity", "name": "Background Opacity",
            "min": 0, "type": NumberField },
        { "parameter": "borderRadius", "name": "Border Radius",
            "min": 0, "type": NumberField },
        { "parameter": "padding", "name": "Padding",
            "min": 0, "type": NumberField },
        { "parameter": "justifyContent", "name": "Justify Content",
            "map": { "Start": "start", "Center": "center", "End": "end" },
            "type": EnumField },
        "textAlign",
        "parentId",
        "position",
        "rotation",
        "scale",
        "renderOrder",
    ];
}

EditorHelperFactory.registerEditorHelper(TextOverlayHelper, TextOverlay);
