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
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
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
        this._video = document.createElement('video');
        this._video.onloadedmetadata = () => {
            let texture = new THREE.VideoTexture(this._video);
            texture.colorSpace = THREE.SRGBColorSpace;
            let width = this._video.videoWidth;
            let height = this._video.videoHeight;
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
        this._video.crossOrigin = "anonymous";
        this._video.src = videoUrl;
        super._setMedia(this._video);
    }

    _getDefaultName() {
        return super._getDefaultName() || 'Video';
    }

    exportParams() {
        let params = super.exportParams();
        params['side'] = this._material.side;
        return params;
    }

    getSide() {
        return this._material.side;
    }

    getStopTopic() {
        return this._stopTopic;
    }

    getVideo() {
        return this._video;
    }

    setLoop(loop) {
        super.setLoop(loop);
        this._video.loop = loop;
    }

    setSide(side) {
        if(side == this._side) return;
        this._side = side;
        this._material.side = side;
        this._material.needsUpdate = true;
    }

    play(position, ignorePublish) {
        if(position != null) {
            this._video.currentTime = position || 0;
        }
        super.play();
        if(ignorePublish) return;
        position = new Float64Array([this._video.currentTime]);
        this.publishMessage(PLAY, position, "");
    }

    pause(position, ignorePublish) {
        super.pause();
        if(position != null) {
            this._video.currentTime = position || 0;
        }
        if(ignorePublish) return;
        position = new Float64Array([this._video.currentTime]);
        this.publishMessage(PAUSE, position, "");
    }

    stop(ignorePublish) {
        this._video.pause();
        this._video.currentTime = 0;
        if(ignorePublish) return;
        super.stop();
    }

    _addPartySubscriptions() {
        super._addPartySubscriptions();
        PubSub.subscribe(this._id, PubSubTopics.SESSION_STARTED, () => {
            if(this._autoplay && !this._alreadyAutoplayed) {
                this.play(null, true);
                this._alreadyAutoplayed = true;
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_READY, (message) => {
            this._onPeerReady(message.peer);
        });
    }

    _isPlaying() {
        return !this._video.paused && !this._video.ended
            && this._video.currentTime > 0 && this._video.readyState > 2;
    }

    _onPeerReady(peer) {
        if(!PartyHandler.isHost()) return;
        let topic = (this._isPlaying()) ? PLAY : PAUSE;
        let position = new Float64Array([this._video.currentTime]);
        this.publishMessage(topic, position, peer);
    }

    removeFromScene() {
        this.stop(true);
        super.removeFromScene();
    }

    static assetType = AssetTypes.VIDEO;
}
