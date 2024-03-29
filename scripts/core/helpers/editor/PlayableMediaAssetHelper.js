/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import CheckboxInput from '/scripts/core/menu/input/CheckboxInput.js';
import TextInput from '/scripts/core/menu/input/TextInput.js';

export default class PlayableMediaAssetHelper extends AssetEntityHelper {
    constructor(asset, updatedTopics) {
        super(asset, updatedTopics);
        this._createPreviewFunctions();
    }

    _createPreviewFunctions() {
        this._previewMedia = false;
        this._asset.getPreviewMedia = () => this._previewMedia;
        this._asset.setPreviewMedia = (previewMedia) => {
            this._previewMedia = previewMedia;
            if(previewMedia) {
                this._asset.play(null, true);
            } else {
                this._asset.stop(true);
            }
        };
    }

    static commonFields = {
        visualEdit: { "parameter": "visualEdit" },
        autoplay: { "parameter": "autoplay", "name": "Auto Play",
            "suppressMenuFocusEvent": true, "type": CheckboxInput },
        loop: { "parameter": "loop", "name": "Loop",
            "suppressMenuFocusEvent": true, "type": CheckboxInput },
        playTopic: { "parameter": "playTopic", "name": "Play Event",
            "type": TextInput },
        pauseTopic: { "parameter": "pauseTopic", "name": "Pause Event",
            "type": TextInput },
        stopTopic: { "parameter": "stopTopic", "name": "Stop Event",
            "type": TextInput },
        parentId: { "parameter": "parentId" },
        position: { "parameter": "position" },
        rotation: { "parameter": "rotation" },
        scale: { "parameter": "scale" },
    };
    
}
