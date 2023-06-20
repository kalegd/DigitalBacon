/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

class ToolHandler {
    constructor() {
        this._id = uuidv4();
        this._tool = null;
    }

    getTool() {
        return this._tool;
    }
    setTool(tool) {
        this._tool = tool;
        PubSub.publish(this._id, PubSubTopics.TOOL_UPDATED, tool);
    }
}

let toolHandler = new ToolHandler();
export default toolHandler;
