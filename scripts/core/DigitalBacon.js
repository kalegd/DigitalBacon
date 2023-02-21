/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';

const version = "0.0.6";

function getDeviceType() {
    return global.deviceType;
}

function disableImmersion() {
    global.disableImmersion = true;
}

export { setup, setupEditor } from '/scripts/core/setup.js';
export { LibraryHandler };
export { ProjectHandler };
export { getDeviceType };
export { disableImmersion };
export { version };
