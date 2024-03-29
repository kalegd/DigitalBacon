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
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';

export default class VideoAssetHelper extends PlayableMediaAssetHelper {
    constructor(asset) {
        super(asset, PubSubTopics.VIDEO_UPDATED);
    }

    place(intersection) {
        let object = intersection.object;
        object.updateMatrixWorld();
        let normal = intersection.face.normal.clone()
            .transformDirection(object.matrixWorld).clampLength(0, 0.001);
        if(global.camera.getWorldDirection(vector3s[0]).dot(normal) > 0)
            normal.negate();
        this._object.position.copy(normal).add(intersection.point);
        this._object.lookAt(normal.add(this._object.position));
        this.roundAttributes(true);
    }

    static fields = [
        this.commonFields.visualEdit,
        { "parameter": "previewMedia", "name": "Preview Video",
            "suppressMenuFocusEvent": true, "type": CheckboxInput},
        { "parameter": "side", "name": "Display", "map": SIDE_MAP,
            "type": EnumInput },
        this.commonFields.autoplay,
        this.commonFields.loop,
        this.commonFields.playTopic,
        this.commonFields.pauseTopic,
        this.commonFields.stopTopic,
        this.commonFields.parentId,
        this.commonFields.position,
        this.commonFields.rotation,
        this.commonFields.scale,
    ];
}

EditorHelperFactory.registerEditorHelper(VideoAssetHelper, VideoAsset);
