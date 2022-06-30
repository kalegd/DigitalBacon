/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Skybox from '/scripts/core/assets/Skybox.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Textures } from '/scripts/core/helpers/constants.js';

class SettingsHandler {
    constructor() {
        this.settings = {
            "Skybox": {},
            "User Settings": {
                "Movement Speed": 3,
                "Enable Flying": true,
            },
        };
        this.editorSettings = {
            "Movement Speed": 3,
            "Enable Flying": true,
            "Swap Joysticks": false,
        };
        this.settings['Skybox'][CubeSides.FRONT] = null;
        this.settings['Skybox'][CubeSides.BACK] = null;
        this.settings['Skybox'][CubeSides.LEFT] = null;
        this.settings['Skybox'][CubeSides.RIGHT] = null;
        this.settings['Skybox'][CubeSides.TOP] = null;
        this.settings['Skybox'][CubeSides.BOTTOM] = null;
    }

    init(scene) {
        this._scene = scene;
        Skybox.init(scene);
    }

    load(settings) {
        if(!settings) {
            for(let side in this.settings['Skybox']) {
                this.settings['Skybox'][side] = null;
            }
            this.settings['User Settings']['Movement Speed'] = 3;
            this.settings['User Settings']['Enable Flying'] = true;
        } else {
            this.settings = settings;
            if(!this.settings['User Settings']) {
                this.settings['User Settings'] = {
                    "Movement Speed": 3,
                    "Enable Flying": true,
                };
            }
        }
        Skybox.setSides(this.settings['Skybox']);
    }

    reset() {
        this.load();
    }

    getSkyboxTextures() {
        let textures = {};
        let skybox = this.settings['Skybox'];
        for(let side in skybox) {
            if(skybox[side]) {
                textures[side] = LibraryHandler.getTexture(skybox[side]);
            } else {
                textures[side] = Textures.searchIcon;
            }
        }
        return textures;
    }

    setSkyboxSide(side, assetId, ignorePublish) {
        //Should validate image size is square before setting Skybox side
        this.settings['Skybox'][side] = assetId;
        Skybox.setSide(side, assetId);
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.SETTINGS_UPDATED, {
                settings: this.settings,
                keys: ['Skybox', side],
            });
    }

    getEditorSettings() {
        return this.editorSettings;
    }

    setEditorSetting(key, value) {
        if(key in this.editorSettings) this.editorSettings[key] = value;
    }

    getUserSettings() {
        return this.settings['User Settings'];
    }

    setUserSetting(key, value, ignorePublish) {
        if(!(key in this.settings['User Settings'])) return;

        this.settings['User Settings'][key] = value;
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.SETTINGS_UPDATED, {
                settings: this.settings,
                keys: ['User Settings', key],
            });
    }

    getMovementSpeed() {
        return (global.isEditor)
            ? this.editorSettings['Movement Speed']
            : this.settings['User Settings']['Movement Speed'];
    }

    isFlyingEnabled() {
        return (global.isEditor)
            ? this.editorSettings['Enable Flying']
            : this.settings['User Settings']['Enable Flying'];
    }

    areJoysticksSwapped() {
        return (global.isEditor)
            ? this.editorSettings['Swap Joysticks']
            : false;//TODO: allow users to access menu and configure a specific
                    //      set of settings
    }

    getSettings() {
        return this.settings;
    }

}

let settingsHandler = new SettingsHandler();
export default settingsHandler;
