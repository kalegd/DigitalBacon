/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { setup, setupEditor } from '/scripts/core/setup.js';
import * as Assets from '/scripts/core/assets/Assets.js';
import Scene from '/scripts/core/assets/Scene.js';
import UserController from '/scripts/core/assets/UserController.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import PartyMessageHelper from '/scripts/core/helpers/PartyMessageHelper.js';
import * as utils from '/scripts/core/helpers/utils.module.js';
import * as EditorHelpers from '/scripts/core/helpers/editor/EditorHelpers.js';
import * as Interactables from '/scripts/core/interactables/Interactables.js';
import * as MenuFields from '/scripts/core/menu/input/MenuFields.js';
import * as DigitalBaconUI from '/scripts/DigitalBacon-UI.js';

const version = "0.2.1";

global.version = version;

function getCamera() {
    return global.camera;
}

function getDeviceType() {
    return global.deviceType;
}

function disableImmersion() {
    global.disableImmersion = true;
}

function isEditor() {
    return global.isEditor;
}

if(window != null) {
    window.DigitalBacon =  {
        Assets: Assets,
        AudioHandler: AudioHandler,
        DigitalBaconUI: DigitalBaconUI,
        EditorHelpers: EditorHelpers,
        Interactables: Interactables,
        LibraryHandler: LibraryHandler,
        MenuFields: MenuFields,
        PartyHandler: PartyHandler,
        PartyMessageHelper: PartyMessageHelper,
        ProjectHandler: ProjectHandler,
        PubSub: PubSub,
        Scene: Scene,
        SettingsHandler: SettingsHandler,
        UserController: UserController,
        disableImmersion: disableImmersion,
        getCamera: getCamera,
        getDeviceType: getDeviceType,
        isEditor: isEditor,
        setup: setup,
        setupEditor: setupEditor,
        utils: utils,
        version: version,
    };
}

export { Assets };
export { AudioHandler };
export { DigitalBaconUI };
export { EditorHelpers };
export { Interactables };
export { LibraryHandler };
export { MenuFields };
export { PartyHandler };
export { PartyMessageHelper };
export { ProjectHandler };
export { PubSub };
export { Scene };
export { SettingsHandler };
export { UserController };
export { disableImmersion };
export { getCamera };
export { getDeviceType };
export { setup, setupEditor };
export { utils };
export { version };
