/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import Component from '/scripts/core/assets/components/Component.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';

export default class PublishComponent extends Component {
    constructor(params = {}) {
        params['assetId'] = PublishComponent.assetId;
        super(params);
        this._topic = params['topic'] || '';
        this._pointerEvent = params['pointerEvent'] || 'click';
        this._gripEvent = params['gripEvent'] || 'none';
        this._touchEvent = params['touchEvent'] || 'none';
    }

    _getDefaultName() {
        return PublishComponent.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['topic'] = this._topic;
        params['pointerEvent'] = this._pointerEvent;
        params['gripEvent'] = this._gripEvent;
        params['touchEvent'] = this._touchEvent;
        return params;
    }

    get topic() { return this._topic; }
    get pointerEvent() { return this._pointerEvent; }
    get gripEvent() { return this._gripEvent; }
    get touchEvent() { return this._touchEvent; }

    set topic(topic) { this._topic = topic; }
    set pointerEvent(pointerEvent) { this._pointerEvent = pointerEvent; }
    set gripEvent(gripEvent) { this._gripEvent = gripEvent; }
    set touchEvent(touchEvent) { this._touchEvent = touchEvent; }

    supports(asset) {
        return asset instanceof AssetEntity;
    }

    static assetId = '2a310a93-3f00-465a-862f-2bf8de118984';
    static assetName = 'Publish Component';
}

ProjectHandler.registerAsset(PublishComponent);
LibraryHandler.loadBuiltIn(PublishComponent);
