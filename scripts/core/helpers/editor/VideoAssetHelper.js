/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import VideoAsset from '/scripts/core/assets/VideoAsset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { vector3s, SIDE_MAP } from '/scripts/core/helpers/constants.js';
import PlayableMediaAssetHelper from '/scripts/core/helpers/editor/PlayableMediaAssetHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

const { CheckboxField, EnumField } = PlayableMediaAssetHelper.FieldTypes;

export default class VideoAssetHelper extends PlayableMediaAssetHelper {
    constructor(asset) {
        super(asset, PubSubTopics.VIDEO_UPDATED);
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
        { "parameter": "previewMedia", "name": "Preview Video",
            "suppressMenuFocusEvent": true, "type": CheckboxField},
        { "parameter": "side", "name": "Display", "map": SIDE_MAP,
            "type": EnumField },
        "autoplay",
        "loop",
        "playTopic",
        "pauseTopic",
        "stopTopic",
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(VideoAssetHelper, VideoAsset);
