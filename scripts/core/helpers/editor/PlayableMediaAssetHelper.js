/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PlayableMediaAsset from '/scripts/core/assets/PlayableMediaAsset.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import AssetEntityHelper from '/scripts/core/helpers/editor/AssetEntityHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';

const { CheckboxField, TextField } = AssetEntityHelper.FieldTypes;

export default class PlayableMediaAssetHelper extends AssetEntityHelper {
    constructor(asset, updatedTopic) {
        super(asset, updatedTopic);
        this._createPreviewFunctions();
    }

    _createPreviewFunctions() {
        this._previewMedia = false;
        Object.defineProperty(this._asset, 'previewMedia', {
            get: () => this._previewMedia,
            set: (previewMedia) => {
                this._previewMedia = previewMedia;
                if(previewMedia) {
                    if(ProjectHandler.getAsset(this._id))
                        this._asset.play(null, true);
                } else {
                    this._asset.stop(true);
                }
            },
        });
    }

    static fields = [
        "visualEdit",
        { "parameter": "previewMedia", "name": "Preview Audio",
            "suppressMenuFocusEvent": true, "type": CheckboxField },
        { "parameter": "autoplay", "name": "Auto Play",
            "suppressMenuFocusEvent": true, "type": CheckboxField },
        { "parameter": "loop", "name": "Loop",
            "suppressMenuFocusEvent": true, "type": CheckboxField },
        { "parameter": "playTopic", "name": "Play Event", "singleLine": true,
            "type": TextField },
        { "parameter": "pauseTopic", "name": "Pause Event", "singleLine": true,
            "type": TextField },
        { "parameter": "stopTopic", "name": "Stop Event", "singleLine": true,
            "type": TextField },
        "parentId",
        "position",
        "rotation",
        "scale",
    ];
}

EditorHelperFactory.registerEditorHelper(PlayableMediaAssetHelper,
    PlayableMediaAsset);
