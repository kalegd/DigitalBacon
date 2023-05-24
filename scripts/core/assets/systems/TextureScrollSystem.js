/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, EditorHelpers, ProjectHandler } = window.DigitalBacon;
const { System } = Assets;
const { EditorHelperFactory, SystemHelper } = EditorHelpers;

const COMPONENT_ASSET_ID = 'a9d2e22f-ddf6-49fe-a420-5fffd5ee69a3';

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
            if(Object.keys(textures).length == 1)
                delete this._scrollDetails[message.componentId];
        });
    }

    update(timeDelta) {
        if(this._disabled) return;
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

if(EditorHelpers) {
    class TextureScrollSystemHelper extends SystemHelper {
        constructor(asset) {
            super(asset);
        }

        static fields = [
            { "parameter": "disabled" },
        ];
    }

    EditorHelperFactory.registerEditorHelper(TextureScrollSystemHelper,
        TextureScrollSystem);
}
