/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { setup, setupEditor } from '/scripts/core/setup.js';
import * as Assets from '/scripts/core/assets/Assets.js';
import UserController from '/scripts/core/assets/UserController.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import PartyMessageHelper from '/scripts/core/helpers/PartyMessageHelper.js';
import * as utils from '/scripts/core/helpers/utils.module.js';
import * as EditorHelpers from '/scripts/core/helpers/editor/EditorHelpers.js';
import * as Interactables from '/scripts/core/interactables/Interactables.js';
import * as MenuInputs from '/scripts/core/menu/input/MenuInputs.js';

const version = "0.1.2";

global.version = version;

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
        EditorHelpers: EditorHelpers,
        Interactables: Interactables,
        LibraryHandler: LibraryHandler,
        MenuInputs: MenuInputs,
        PartyMessageHelper: PartyMessageHelper,
        ProjectHandler: ProjectHandler,
        PubSub: PubSub,
        UserController: UserController,
        disableImmersion: disableImmersion,
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
export { EditorHelpers };
export { Interactables };
export { LibraryHandler };
export { MenuInputs };
export { PartyMessageHelper };
export { ProjectHandler };
export { PubSub };
export { UserController };
export { disableImmersion };
export { getDeviceType };
export { setup, setupEditor };
export { utils };
export { version };
