/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PlainText from '/scripts/core/assets/texts/PlainText.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import TextAssetHelper from '/scripts/core/helpers/editor/TextAssetHelper.js';

const { NumberField } = TextAssetHelper.FieldTypes;

export default class PlainTextHelper extends TextAssetHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "visualEdit",
        "text",
        "fontSize",
        { "parameter": "maxWidth", "name": "Max Width", "min": 0,
            "type": NumberField },
        "fontColor",
        "textAlign",
        "position",
        "rotation",
        "scale",
        "renderOrder",
    ];
}

EditorHelperFactory.registerEditorHelper(PlainTextHelper, PlainText);
