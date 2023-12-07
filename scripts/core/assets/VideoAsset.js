/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { defaultImageSize } from '/scripts/core/helpers/constants.js';
import { concatenateArrayBuffers, numberOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const PLAY = 0;
const PAUSE = 1;
const STOP = 2;

export default class VideoAsset extends AssetEntity {
    constructor(params = {}) {
        super(params);
        this._autoplay = params['autoplay'] || false;
        this._loop = params['loop'] || false;
        this._side = numberOr(params['side'], THREE.DoubleSide);
        this._createMesh(params['assetId']);
        this.setPlayTopic(params['playTopic'] || '');
        this.setPauseTopic(params['pauseTopic'] || '');
        this.setStopTopic(params['stopTopic'] || '');
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
        this._video.onloadedmetadata = (e) => {
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

    }

    _getDefaultName() {
        return LibraryHandler.getAssetName(this._assetId) || 'Video';
    }

    exportParams() {
        let params = super.exportParams();
        params['autoplay'] = this._autoplay;
        params['loop'] = this._loop;
        params['pauseTopic'] = this._pauseTopic;
        params['playTopic'] = this._playTopic;
        params['side'] = this._material.side;
        params['stopTopic'] = this._stopTopic;
        return params;
    }

    getAutoplay(autoplay) {
        return this._autoplay;
    }

    getLoop(loop) {
        return this._loop;
    }

    getPlayTopic(playTopic) {
        return this._playTopic;
    }

    getPauseTopic(pauseTopic) {
        return this._pauseTopic;
    }

    getSide() {
        return this._material.side;
    }

    getStopTopic(stopTopic) {
        return this._stopTopic;
    }

    getVideo() {
        return this._video;
    }

    setAutoplay(autoplay) {
        this._autoplay = autoplay;
        if(!global.isEditor) this._video.autoplay = autoplay;
    }

    setLoop(loop) {
        this._loop = loop;
        this._video.loop = loop;
    }

    setPlayTopic(playTopic) {
        if(this._playTopic) {
            PubSub.unsubscribe(this._id, this._playTopic);
        }
        this._playTopic = playTopic;
        if(this._playTopic) {
            PubSub.subscribe(this._id, this._playTopic, (message) => {
                if(!global.isEditor) this.play(null, true);
            });
        }
    }

    setPauseTopic(pauseTopic) {
        if(this._pauseTopic) {
            PubSub.unsubscribe(this._id, this._pauseTopic);
        }
        this._pauseTopic = pauseTopic;
        if(this._pauseTopic) {
            PubSub.subscribe(this._id, this._pauseTopic, (message) => {
                if(!global.isEditor) this.pause(null, true);
            });
        }
    }

    setSide(side) {
        if(side == this._side) return;
        this._side = side;
        this._material.side = side;
        this._material.needsUpdate = true;
    }

    setStopTopic(stopTopic) {
        if(this._stopTopic) {
            PubSub.unsubscribe(this._id, this._stopTopic);
        }
        this._stopTopic = stopTopic;
        if(this._stopTopic) {
            PubSub.subscribe(this._id, this._stopTopic, (message) => {
                if(!global.isEditor) this.stop(true);
            });
        }
    }

    play(position, ignorePublish) {
        if(position != null) {
            this._video.currentTime = position || 0;
        }
        this._video.play();
        if(ignorePublish) return;
        let type = new Uint8Array([PLAY]);
        position = new Float64Array([this._video.currentTime]);
        let message = concatenateArrayBuffers(type, position);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message);
    }

    pause(position, ignorePublish) {
        this._video.pause();
        if(position != null) {
            this._video.currentTime = position || 0;
        }
        if(ignorePublish) return;
        let type = new Uint8Array([PAUSE]);
        position = new Float64Array([this._video.currentTime]);
        let message = concatenateArrayBuffers(type, position);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message);
    }

    stop(ignorePublish) {
        this._video.pause();
        this._video.currentTime = 0;
        if(ignorePublish) return;
        let message = new Uint8Array([STOP]);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message);
    }

    _addPartySubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.SESSION_STARTED, () => {
            if(this._autoplay && !this._alreadyAutoplayed) {
                this.play(null, true);
                this._alreadyAutoplayed = true;
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_READY, (message) => {
            this._onPeerReady(message.peer);
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            this._onPartyStarted(PartyHandler.isHost());
        });
        PartyHandler.addInternalBufferMessageHandler(this._id, (p, m) => {
            let type = new Uint8Array(m, 0, 1);
            if(type[0] == PLAY) {
                let message = new Float64Array(m.slice(1));
                this.play(message[0], true);
            } else if(type[0] == PAUSE) {
                let message = new Float64Array(m.slice(1));
                this.pause(message[0], true);
            } else if(type[0] == STOP) {
                this.stop(true);
            }
        });
    }

    _isPlaying() {
        return !this._video.paused && !this._video.ended
            && this._video.currentTime > 0 && this._video.readyState > 2;
    }

    _onPeerReady(peer) {
        if(!PartyHandler.isHost()) return;
        let topic = (this._isPlaying()) ? PLAY : PAUSE;
        let type = new Uint8Array([topic]);
        let position = new Float64Array([this._video.currentTime]);
        let message = concatenateArrayBuffers(type, position);
        PartyHandler.publishInternalBufferMessage(this._idBytes, message, peer);
    }

    _onPartyStarted(isHost) {
        if(isHost) return;
        this.stop(true);
    }

    removeFromScene() {
        this.stop(true);
        super.removeFromScene();
    }

    static assetType = AssetTypes.VIDEO;
}
