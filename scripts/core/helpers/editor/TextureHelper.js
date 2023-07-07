/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Texture from '/scripts/core/assets/textures/Texture.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { COLOR_SPACE_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelper from '/scripts/core/helpers/editor/EditorHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';

export default class TextureHelper extends EditorHelper {
    constructor(asset) {
        super(asset, PubSubTopics.TEXTURE_UPDATED);
    }

    static fields = [
        { "parameter": "colorSpace", "name": "Color Space",
            "map": COLOR_SPACE_MAP, "type": EnumInput },
    ];
}

EditorHelperFactory.registerEditorHelper(TextureHelper, Texture);
