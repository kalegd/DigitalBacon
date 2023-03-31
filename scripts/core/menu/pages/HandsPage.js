/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import HandTools from '/scripts/core/enums/HandTools.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import { FontSizes } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import ThreeMeshUI from 'three-mesh-ui';

const hands = [
    { "title": "Edit", "type": HandTools.EDIT },
    { "title": "Copy / Paste", "type": HandTools.COPY_PASTE },
    { "title": "Delete", "type": HandTools.DELETE },
    { "title": "Translate", "type": HandTools.TRANSLATE },
    { "title": "Rotate", "type": HandTools.ROTATE },
];

class HandsPage extends MenuPage {
    constructor(controller) {
        super(controller, true);
        this._addPageContent();
    }

    _addPageContent() {
        let titleBlock = ThreeMeshUIHelper.createTextBlock({
            'text': 'Hand Tools',
            'fontSize': FontSizes.header,
            'height': 0.04,
            'width': 0.2,
        });
        this._container.add(titleBlock);

        let columnBlock = new ThreeMeshUI.Block({
            'height': 0.2,
            'width': 0.45,
            'contentDirection': 'column',
            'justifyContent': 'start',
            'backgroundOpacity': 0,
        });
        for(let hand of hands) {
            let button = ThreeMeshUIHelper.createButtonBlock({
                'text': hand.title,
                'fontSize': FontSizes.body,
                'height': 0.035,
                'width': 0.3,
                'margin': 0.002,
            });
            columnBlock.add(button);
            let interactable = new PointerInteractable(button, () => {
                if(HandTools.ACTIVE == hand.type) return;
                HandTools.ACTIVE = hand.type;
                PubSub.publish(this._id, PubSubTopics.HAND_TOOLS_SWITCH, hand.type);
            });
            this._containerInteractable.addChild(interactable);
        }
        this._container.add(columnBlock);
    }

}

export default HandsPage;
