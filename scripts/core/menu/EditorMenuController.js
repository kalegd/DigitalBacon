/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import MenuController from '/scripts/core/menu/MenuController.js';
import AssetPage from '/scripts/core/menu/pages/AssetPage.js';
import AssetsPage from '/scripts/core/menu/pages/AssetsPage.js';
import AssetSelectPage from '/scripts/core/menu/pages/AssetSelectPage.js';
import ColorWheelPage from '/scripts/core/menu/pages/ColorWheelPage.js';
import EditorSettingsPage from '/scripts/core/menu/pages/EditorSettingsPage.js';
import HandsPage from '/scripts/core/menu/pages/HandsPage.js';
import HostPartyPage from '/scripts/core/menu/pages/HostPartyPage.js';
import InstancePage from '/scripts/core/menu/pages/InstancePage.js';
import JoinPartyPage from '/scripts/core/menu/pages/JoinPartyPage.js';
import LoadFromGDrivePage from '/scripts/core/menu/pages/LoadFromGDrivePage.js';
import LibraryPage from '/scripts/core/menu/pages/LibraryPage.js';
import LibrarySearchPage from '/scripts/core/menu/pages/LibrarySearchPage.js';
import MaterialPage from '/scripts/core/menu/pages/MaterialPage.js';
import MaterialsPage from '/scripts/core/menu/pages/MaterialsPage.js';
import NavigationPage from '/scripts/core/menu/pages/NavigationPage.js';
import NewMaterialPage from '/scripts/core/menu/pages/NewMaterialPage.js';
import NewTexturePage from '/scripts/core/menu/pages/NewTexturePage.js';
import PartyPage from '/scripts/core/menu/pages/PartyPage.js';
import PeerPage from '/scripts/core/menu/pages/PeerPage.js';
import ProjectPage from '/scripts/core/menu/pages/ProjectPage.js';
import SettingsPage from '/scripts/core/menu/pages/SettingsPage.js';
import SkyboxPage from '/scripts/core/menu/pages/SkyboxPage.js';
import TexturePage from '/scripts/core/menu/pages/TexturePage.js';
import TexturesPage from '/scripts/core/menu/pages/TexturesPage.js';
import TextInputPage from '/scripts/core/menu/pages/TextInputPage.js';
import UploadPage from '/scripts/core/menu/pages/UploadPage.js';
import UserSettingsPage from '/scripts/core/menu/pages/UserSettingsPage.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { vector2, vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

export default class EditorMenuController extends MenuController {
    constructor() {
        super();
        this._pages[MenuPages.ASSET] = new AssetPage(this);
        this._pages[MenuPages.ASSETS] = new AssetsPage(this);
        this._pages[MenuPages.ASSET_SELECT] = new AssetSelectPage(this);
        this._pages[MenuPages.COLOR_WHEEL] = new ColorWheelPage(this);
        this._pages[MenuPages.EDITOR_SETTINGS] = new EditorSettingsPage(this);
        this._pages[MenuPages.HOST_PARTY] = new HostPartyPage(this);
        this._pages[MenuPages.INSTANCE] = new InstancePage(this);
        this._pages[MenuPages.JOIN_PARTY] = new JoinPartyPage(this);
        this._pages[MenuPages.LIBRARY] = new LibraryPage(this);
        this._pages[MenuPages.LIBRARY_SEARCH] = new LibrarySearchPage(this);
        this._pages[MenuPages.LOAD_GDRIVE] = new LoadFromGDrivePage(this);
        this._pages[MenuPages.MATERIAL] = new MaterialPage(this);
        this._pages[MenuPages.MATERIALS] = new MaterialsPage(this);
        this._pages[MenuPages.NAVIGATION] = new NavigationPage(this);
        this._pages[MenuPages.NEW_MATERIAL] = new NewMaterialPage(this);
        this._pages[MenuPages.NEW_TEXTURE] = new NewTexturePage(this);
        this._pages[MenuPages.PARTY] = new PartyPage(this);
        this._pages[MenuPages.PEER] = new PeerPage(this);
        this._pages[MenuPages.PROJECT] = new ProjectPage(this);
        this._pages[MenuPages.SETTINGS] = new SettingsPage(this);
        this._pages[MenuPages.SKYBOX] = new SkyboxPage(this);
        this._pages[MenuPages.TEXTURE] = new TexturePage(this);
        this._pages[MenuPages.TEXTURES] = new TexturesPage(this);
        this._pages[MenuPages.TEXT_INPUT] = new TextInputPage(this);
        this._pages[MenuPages.UPLOAD] = new UploadPage(this);
        this._pages[MenuPages.USER_SETTINGS] = new UserSettingsPage(this);
        this._pageCalls.push(MenuPages.NAVIGATION);
        if(global.deviceType == 'XR') {
            this._pages[MenuPages.HANDS] = new HandsPage(this);
        }
    }

    _createInteractables() {
        super._createInteractables();
        UndoRedoHandler.addButtons(this._object, this._pointerInteractable);
    }
}