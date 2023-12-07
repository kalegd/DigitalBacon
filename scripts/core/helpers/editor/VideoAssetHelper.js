/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import VideoAsset from '/scripts/core/assets/VideoAsset.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { vector3s, SIDE_MAP } from '/scripts/core/helpers/constants.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import TextInput from '/scripts/core/menu/input/TextInput.js';

export default class VideoAssetHelper extends AssetEntityHelper {
    constructor(asset) {
        super(asset, PubSubTopics.VIDEO_UPDATED);
        this._createPreviewFunctions();
    }

    _createPreviewFunctions() {
        this._previewVideo = false;
        this._asset.getPreviewVideo = () => { return this._previewVideo; };
        this._asset.setPreviewVideo = (previewVideo) => {
            this._previewVideo = previewVideo;
            if(previewVideo) {
                this._asset.play(null, true);
            } else {
                this._asset.stop(true);
            }
        }
    }

    place(intersection) {
        let object = intersection.object;
        let point = intersection.point;
        let face = intersection.face;
        object.updateMatrixWorld();
        let normal = intersection.face.normal.clone()
            .transformDirection(object.matrixWorld).clampLength(0, 0.001);
        if(global.camera.getWorldDirection(vector3s[0]).dot(normal) > 0)
            normal.negate();
        this._object.position.copy(normal).add(point);
        this._object.lookAt(normal.add(this._object.position));
        this.roundAttributes(true);
    }

    static fields = [
        { "parameter": "visualEdit" },
        { "parameter": "previewVideo", "name": "Preview Video",
            "suppressMenuFocusEvent": true, "type": CheckboxInput},
        { "parameter": "side", "name": "Display", "map": SIDE_MAP,
            "type": EnumInput },
        { "parameter": "autoplay", "name": "Auto Play",
            "suppressMenuFocusEvent": true, "type": CheckboxInput },
        { "parameter": "loop", "name": "Loop",
            "suppressMenuFocusEvent": true, "type": CheckboxInput },
        { "parameter": "playTopic", "name": "Play Event", "type": TextInput },
        { "parameter": "pauseTopic", "name": "Pause Event", "type": TextInput },
        { "parameter": "stopTopic", "name": "Stop Event", "type": TextInput },
        { "parameter": "parentId" },
        { "parameter": "position" },
        { "parameter": "rotation" },
        { "parameter": "scale" },
    ];
}

EditorHelperFactory.registerEditorHelper(VideoAssetHelper, VideoAsset);
