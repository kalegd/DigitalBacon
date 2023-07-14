/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, PartyHandler, PartyMessageHelper, ProjectHandler } = window.DigitalBacon;
const { System } = Assets;

const COMPONENT_ASSET_ID = 'a9d2e22f-ddf6-49fe-a420-5fffd5ee69a3';
const PEER_TOPIC = 'TextureScrollSystem:offsets';

export default class TextureScrollSystem extends System {
    constructor(params = {}) {
        params['assetId'] = TextureScrollSystem.assetId;
        super(params);
        this._scrollDetails = {};
        this._addSubscriptions();
    }

    _getDefaultName() {
        return TextureScrollSystem.assetName;
    }

    getDescription() {
        return 'Scrolls Textures';
    }

    _addSubscriptions() {
        this._listenForComponentAttached(COMPONENT_ASSET_ID, (message) => {
            let texture = ProjectHandler.getSessionAsset(message.id);
            let component = ProjectHandler.getSessionAsset(message.componentId);
            if(!this._scrollDetails[message.componentId]) {
                this._scrollDetails[message.componentId] = {
                    component: component,
                    textures: {},
                };
            }
            let textures = this._scrollDetails[message.componentId].textures;
            textures[message.id] = texture;
        });
        this._listenForComponentDetached(COMPONENT_ASSET_ID, (message) => {
            let componentMap = this._scrollDetails[message.componentId];
            if(!componentMap) return;
            let textures = componentMap.textures;
            if(textures[message.id]) {
                let texture = textures[message.id];
                texture.setOffset(texture.getOffset());
                delete textures[message.id];
            }
            if(Object.keys(textures).length == 0)
                delete this._scrollDetails[message.componentId];
        });
        PartyMessageHelper.registerBlockableHandler(PEER_TOPIC, (p, m) => {
            this._handleOffsets(p, m);
        });
    }

    _onPeerReady() {
        if(!PartyHandler.isHost()) return;
        let offsets = {};
        for(let componentId in this._scrollDetails) {
            let component = this._scrollDetails[componentId].component;
            let textures = this._scrollDetails[componentId].textures;
            offsets[componentId] = {};
            for(let textureId in textures) {
                let texture = textures[textureId].getTexture();
                offsets[componentId][textureId]
                    = [texture.offset.x, texture.offset.y];
            }
        }
        this._publish(offsets);
    }

    _handleOffsets(p, m) {
        let offsets = m.offsets;
        for(let componentId in offsets) {
            let component = this._scrollDetails[componentId].component;
            let textures = this._scrollDetails[componentId].textures;
            for(let textureId in textures) {
                if(!(textureId in offsets[componentId])) continue;
                let peerOffset = offsets[componentId][textureId];
                let texture = textures[textureId];
                texture = texture.getTexture();
                let offset = texture.offset;
                offset.setX(peerOffset[0]);
                offset.setY(peerOffset[1]);
            }
        }
    }

    _publish(offsets) {
        let message = {
            topic: PEER_TOPIC,
            offsets: offsets,
        };
        PartyMessageHelper.queuePublish(JSON.stringify(message));
    }

    update(timeDelta) {
        for(let componentId in this._scrollDetails) {
            let component = this._scrollDetails[componentId].component;
            let textures = this._scrollDetails[componentId].textures;
            let scrollPercent = component.getScrollPercent();
            let period = component.getPeriod();
            let multiplier = timeDelta / 100 / period;
            let xDiff = scrollPercent[0] * multiplier;
            let yDiff = scrollPercent[1] * multiplier;
            for(let textureId in textures) {
                let texture = textures[textureId];
                texture = texture.getTexture();
                let offset = texture.offset;
                if(xDiff) offset.setX(offset.x + xDiff);
                if(yDiff) offset.setY(offset.y + yDiff);
            }
        }
    }

    static assetId = '2c7f5320-0371-4d99-b546-2eb18a343d3f';
    static assetName = 'Texture Scroller';
}

ProjectHandler.registerAsset(TextureScrollSystem);
