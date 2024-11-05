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
import * as THREE from 'three';

const version = "0.3.10";
const dynamicAssets = global.dynamicAssets;

global.version = version;

function getCamera() {
    return global.camera;
}

function getDeviceType() {
    return global.deviceType;
}

function getMenuController() {
    return global.menuController;
}

function getRenderer() {
    return global.renderer;
}

function isEditor() {
    return global.isEditor;
}

function isImmersionDisabled() {
    return global.immersionDisabled;
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
        THREE: THREE,
        UserController: UserController,
        dynamicAssets: dynamicAssets,
        getCamera: getCamera,
        getDeviceType: getDeviceType,
        getMenuController: getMenuController,
        getRenderer: getRenderer,
        isEditor: isEditor,
        isImmersionDisabled: isImmersionDisabled,
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
export { THREE };
export { UserController };
export { dynamicAssets };
export { getCamera };
export { getDeviceType };
export { getMenuController };
export { getRenderer };
export { isEditor };
export { isImmersionDisabled };
export { setKeyboardLock };
export { setup, setupEditor };
export { utils };
export { version };
