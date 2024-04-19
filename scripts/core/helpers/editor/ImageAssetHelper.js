/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import ImageAsset from '/scripts/core/assets/ImageAsset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { vector3s, SIDE_MAP } from '/scripts/core/helpers/constants.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

const { EnumField } = AssetEntityHelper.FieldTypes;

export default class ImageAssetHelper extends AssetEntityHelper {
    constructor(asset) {
        super(asset, PubSubTopics.IMAGE_UPDATED);
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
        "visualEdit",
        { "parameter": "side", "name": "Display", "map": SIDE_MAP,
            "type": EnumField },
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(ImageAssetHelper, ImageAsset);
