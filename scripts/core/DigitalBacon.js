/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { setup, setupEditor } from '/scripts/core/setup.js';
import AssetEntity from '/scripts/core/assets/AssetEntity.js';
import Component from '/scripts/core/assets/components/Component.js';
import Material from '/scripts/core/assets/materials/Material.js';
import ComponentsHandler from '/scripts/core/handlers/ComponentsHandler.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import ComponentHelper from '/scripts/core/helpers/editor/ComponentHelper.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import * as utils from '/scripts/core/helpers/utils.module.js';
import * as MenuInputs from '/scripts/core/menu/input/MenuInputs.js';

const version = "0.1.2";

global.version = version;

function getDeviceType() {
    return global.deviceType;
}

function disableImmersion() {
    global.disableImmersion = true;
}


if(window != null) {
    window.DigitalBacon =  {
        AssetEntity: AssetEntity,
        Component: Component,
        ComponentsHandler: ComponentsHandler,
        ComponentHelper: ComponentHelper,
        EditorHelperFactory: EditorHelperFactory,
        LibraryHandler: LibraryHandler,
        Material: Material,
        MaterialsHandler: MaterialsHandler,
        MenuInputs: MenuInputs,
        ProjectHandler: ProjectHandler,
        disableImmersion: disableImmersion,
        getDeviceType: getDeviceType,
        setup: setup,
        setupEditor: setupEditor,
        utils: utils,
        version: version,
    };
}

export { AssetEntity };
export { Component };
export { ComponentsHandler };
export { ComponentHelper };
export { EditorHelperFactory };
export { LibraryHandler };
export { Material };
export { MaterialsHandler };
export { MenuInputs };
export { ProjectHandler };
export { disableImmersion };
export { getDeviceType };
export { setup, setupEditor };
export { utils };
export { version };
