/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import MenuPage from '/scripts/core/menu/pages/MenuPage.js';
import { Div } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class PaginatedPage extends MenuPage {
    constructor(controller, hasBackButton) {
        super(controller, hasBackButton);
        this._page = 0;
    }

    _createPreviousAndNextButtons() {
        this._previousButtonParent = new Div({ width: 0.04 });
        this._previousButton = createSmallButton('<');
        this._previousButton.onClickAndTouch = () => {
            this._page -= 1;
            this._updateItemsGUI();
        };
        this._previousButtonParent.add(this._previousButton);
        this._nextButtonParent = new Div({ width: 0.04 });
        this._nextButton = createSmallButton('>');
        this._nextButton.onClickAndTouch = () => {
            this._page += 1;
            this._updateItemsGUI();
        };
        this._nextButtonParent.add(this._nextButton);
    }

    _updatePreviousAndNextButtons(lastIndex) {
        if(this._page == 0) {
            if(this._previousButton.parentComponent)
                this._previousButtonParent.remove(this._previousButton);
        } else if(!this._previousButton.parentComponent) {
            this._previousButtonParent.add(this._previousButton);
        }
        if(this._items.length > lastIndex) {
            if(!this._nextButton.parentComponent)
                this._nextButtonParent.add(this._nextButton);
        } else if(this._nextButton.parentComponent) {
            this._nextButtonParent.remove(this._nextButton);
        }
    }

    _updateItemsGUI() {
        console.error("PaginatedPage._updateItemsGUI() should be overridden");
    }
}

export default PaginatedPage;
