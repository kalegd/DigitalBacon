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
import OrbitDisablingPointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import * as utils from '/scripts/core/helpers/utils.module.js';
import * as EditorHelpers from '/scripts/core/helpers/editor/EditorHelpers.js';
import * as DigitalBaconUI from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const version = "0.3.5";

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

function setKeyboardLock(lock) {
    global.keyboardLock = lock;
}

if(window != null) {
    window.DigitalBacon =  {
        Assets: Assets,
        AudioHandler: AudioHandler,
        DigitalBaconUI: DigitalBaconUI,
        EditorHelpers: EditorHelpers,
        LibraryHandler: LibraryHandler,
        OrbitDisablingPointerInteractable: OrbitDisablingPointerInteractable,
        PartyHandler: PartyHandler,
        ProjectHandler: ProjectHandler,
        PubSub: PubSub,
        Scene: Scene,
        SettingsHandler: SettingsHandler,
        UserController: UserController,
        disableImmersion: disableImmersion,
        getCamera: getCamera,
        getDeviceType: getDeviceType,
        isEditor: isEditor,
        setKeyboardLock: setKeyboardLock,
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
export { LibraryHandler };
export { OrbitDisablingPointerInteractable };
export { PartyHandler };
export { ProjectHandler };
export { PubSub };
export { Scene };
export { SettingsHandler };
export { UserController };
export { disableImmersion };
export { getCamera };
export { getDeviceType };
export { isEditor };
export { setKeyboardLock };
export { setup, setupEditor };
export { utils };
export { version };
