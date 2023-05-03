/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Material from '/scripts/core/assets/materials/Material.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import * as utils from '/scripts/core/helpers/utils.module.js';

const version = "0.1.2";

function getDeviceType() {
    return global.deviceType;
}

function disableImmersion() {
    global.disableImmersion = true;
}

export { setup, setupEditor } from '/scripts/core/setup.js';
export { LibraryHandler };
export { Material };
export { MaterialsHandler };
export { ProjectHandler };
export { disableImmersion };
export { getDeviceType };
export { utils };
export { version };
