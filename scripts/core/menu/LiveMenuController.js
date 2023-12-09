/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuPages from '/scripts/core/enums/MenuPages.js';
import MenuController from '/scripts/core/menu/MenuController.js';
import AcknowledgementsPage from '/scripts/core/menu/pages/AcknowledgementsPage.js';
import HomePage from '/scripts/core/menu/pages/HomePage.js';
import HostPartyPage from '/scripts/core/menu/pages/HostPartyPage.js';
import JoinPartyPage from '/scripts/core/menu/pages/JoinPartyPage.js';
import PartyPage from '/scripts/core/menu/pages/PartyPage.js';
import PeerPage from '/scripts/core/menu/pages/PeerPage.js';
import SettingsPage from '/scripts/core/menu/pages/SettingsPage.js';
import UserSettingsPage from '/scripts/core/menu/pages/UserSettingsPage.js';

export default class LiveMenuController extends MenuController {
    constructor() {
        super();
        this._pages[MenuPages.ACKNOWLEDGEMENTS] =new AcknowledgementsPage(this);
        this._pages[MenuPages.HOME] = new HomePage(this);
        this._pages[MenuPages.HOST_PARTY] = new HostPartyPage(this);
        this._pages[MenuPages.JOIN_PARTY] = new JoinPartyPage(this);
        this._pages[MenuPages.PARTY] = new PartyPage(this);
        this._pages[MenuPages.PEER] = new PeerPage(this);
        this._pages[MenuPages.SETTINGS] = new SettingsPage(this);
        this._pages[MenuPages.USER_SETTINGS] = new UserSettingsPage(this);
        this._pageCalls.push(MenuPages.HOME);
    }
}
