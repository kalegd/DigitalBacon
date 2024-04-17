/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BasicTexture from '/scripts/core/assets/textures/BasicTexture.js';
import { WRAP_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import TextureHelper from '/scripts/core/helpers/editor/TextureHelper.js';
import EnumField from '/scripts/core/menu/input/EnumField.js';
import ImageField from '/scripts/core/menu/input/ImageField.js';
import Vector2Field from '/scripts/core/menu/input/Vector2Field.js';

export default class BasicTextureHelper extends TextureHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "image", "name": "Image", "type": ImageField },
        { "parameter": "wrapS", "name": "Horizontal Wrapping", "map": WRAP_MAP,
            "type": EnumField },
        { "parameter": "wrapT", "name": "Vertical Wrapping", "map": WRAP_MAP,
            "type": EnumField },
        { "parameter": "repeat", "name": "Repeat", "type": Vector2Field },
        { "parameter": "offset", "name": "Offset", "type": Vector2Field },
        { "parameter": "colorSpace" },
    ];
}

EditorHelperFactory.registerEditorHelper(BasicTextureHelper, BasicTexture);
