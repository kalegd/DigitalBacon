/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import CubeTexture from '/scripts/core/assets/textures/CubeTexture.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { MAPPING_MAP } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import TextureHelper from '/scripts/core/helpers/editor/TextureHelper.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import CubeImageInput from '/scripts/core/menu/input/CubeImageInput.js';

export default class CubeTextureHelper extends TextureHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "images", "name": "Images", "type": CubeImageInput },
        { "parameter": "mapping", "name": "Mapping", "map": MAPPING_MAP,
            "type": EnumInput },
    ];
}

EditorHelperFactory.registerEditorHelper(CubeTextureHelper, CubeTexture);
