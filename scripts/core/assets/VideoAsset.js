/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PlayableMediaAsset from '/scripts/core/assets/PlayableMediaAsset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { defaultImageSize } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class VideoAsset extends PlayableMediaAsset {
    constructor(params = {}) {
        super(params);
        this._side = numberOr(params['side'], THREE.DoubleSide);
        this._createMesh(params['assetId']);
        if(!global.isEditor) this._addPartySubscriptions();
    }

    _createMesh(assetId) {
        this._material = new THREE.MeshBasicMaterial({
            side: this._side,
            transparent: false,
        });
        let videoUrl = LibraryHandler.getUrl(assetId);
        if(!videoUrl) return;
        this._media = document.createElement('video');
        this._media.playsInline = true;
        this._media.onloadedmetadata = () => {
            let texture = new THREE.VideoTexture(this._media);
            texture.colorSpace = THREE.SRGBColorSpace;
            let width = this._media.videoWidth;
            let height = this._media.videoHeight;
            if(width > height) {
                height *= defaultImageSize / width;
                width = defaultImageSize;
            } else {
                width *= defaultImageSize / height;
                height = defaultImageSize;
            }
            let geometry = new THREE.PlaneGeometry(width, height);
            this._material.map = texture;
            this._material.needsUpdate = true;
            let mesh = new THREE.Mesh( geometry, this._material );
            this._object.add(mesh);
        };
        this._media.crossOrigin = "anonymous";
        this._media.src = videoUrl;
        this._media.loop = this._loop;
        if(global.immersionDisabled && this._autoplay) {
            this._media.muted = true;
            this._media.play();
        }
        this._updateBVH();
    }

    _getDefaultName() {
        return super._getDefaultName() || 'Video';
    }

    exportParams() {
        let params = super.exportParams();
        params['side'] = this._material.side;
        return params;
    }

    get isPlaying() {
        return !this._media.paused && !this._media.ended
            && this._media.currentTime > 0 && this._media.readyState > 2;
    }
    get loop() { return super.loop; }
    get progress() { return this._media.currentTime; }
    get side() { return this._material.side; }
    get video() { return this._media; }

    set loop(loop) {
        super.loop = loop;
        this._media.loop = loop;
    }
    set progress(position) {
        if(position != null) {
            this._media.currentTime = position || 0;
        }
    }
    set side(side) {
        if(side == this._side) return;
        this._side = side;
        this._material.side = side;
        this._material.needsUpdate = true;
    }

    static assetType = AssetTypes.VIDEO;
}
