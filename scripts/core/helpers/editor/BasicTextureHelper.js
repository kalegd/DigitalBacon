/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BasicTexture from '/scripts/core/assets/textures/BasicTexture.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { WRAP_MAP, REVERSE_WRAP_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import TextureHelper from '/scripts/core/helpers/editor/TextureHelper.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import ImageInput from '/scripts/core/menu/input/ImageInput.js';
import Vector2Input from '/scripts/core/menu/input/Vector2Input.js';

export default class BasicTextureHelper extends TextureHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "image", "name": "Image", "type": ImageInput },
        { "parameter": "wrapS", "name": "Horizontal Wrapping",
            "type": EnumInput, "options": [ "Clamp", "Repeat", "Mirrored"],
            "map": WRAP_MAP, "reverseMap": REVERSE_WRAP_MAP },
        { "parameter": "wrapT", "name": "Vertical Wrapping", "type": EnumInput,
            "options": [ "Clamp", "Repeat", "Mirrored"], "map": WRAP_MAP,
            "reverseMap": REVERSE_WRAP_MAP },
        { "parameter": "repeat", "name": "Repeat", "type": Vector2Input },
        { "parameter": "offset", "name": "Offset", "type": Vector2Input },
    ];
}

EditorHelperFactory.registerEditorHelper(BasicTextureHelper, BasicTexture);
