/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import UserController from '/scripts/core/assets/UserController.js';
import Hands from '/scripts/core/enums/Hands.js';
import MenuPages from '/scripts/core/enums/MenuPages.js';
import NotificationHub from '/scripts/core/menu/NotificationHub.js';
import AssetPage from '/scripts/core/menu/pages/AssetPage.js';
import AssetsPage from '/scripts/core/menu/pages/AssetsPage.js';
import AssetSelectPage from '/scripts/core/menu/pages/AssetSelectPage.js';
import ColorWheelPage from '/scripts/core/menu/pages/ColorWheelPage.js';
import EditorSettingsPage from '/scripts/core/menu/pages/EditorSettingsPage.js';
import HandsPage from '/scripts/core/menu/pages/HandsPage.js';
import InstancePage from '/scripts/core/menu/pages/InstancePage.js';
import LoadFromGDrivePage from '/scripts/core/menu/pages/LoadFromGDrivePage.js';
import LibraryPage from '/scripts/core/menu/pages/LibraryPage.js';
import LibrarySearchPage from '/scripts/core/menu/pages/LibrarySearchPage.js';
import MaterialPage from '/scripts/core/menu/pages/MaterialPage.js';
import MaterialsPage from '/scripts/core/menu/pages/MaterialsPage.js';
import NavigationPage from '/scripts/core/menu/pages/NavigationPage.js';
import NewMaterialPage from '/scripts/core/menu/pages/NewMaterialPage.js';
import NewTexturePage from '/scripts/core/menu/pages/NewTexturePage.js';
import ProjectPage from '/scripts/core/menu/pages/ProjectPage.js';
import SettingsPage from '/scripts/core/menu/pages/SettingsPage.js';
import SkyboxPage from '/scripts/core/menu/pages/SkyboxPage.js';
import TexturePage from '/scripts/core/menu/pages/TexturePage.js';
import TexturesPage from '/scripts/core/menu/pages/TexturesPage.js';
import TextInputPage from '/scripts/core/menu/pages/TextInputPage.js';
import UploadPage from '/scripts/core/menu/pages/UploadPage.js';
import UserSettingsPage from '/scripts/core/menu/pages/UserSettingsPage.js';
import Keyboard from '/scripts/core/menu/input/Keyboard.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import MenuGripInteractable from '/scripts/core/interactables/MenuGripInteractable.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { vector2, vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

export default class MenuController extends PointerInteractableEntity {
    constructor() {
        super();
        this._object.position.setZ(-100);
        this._pages = {};
        this._pages[MenuPages.ASSET] = new AssetPage(this);
        this._pages[MenuPages.ASSETS] = new AssetsPage(this);
        this._pages[MenuPages.ASSET_SELECT] = new AssetSelectPage(this);
        this._pages[MenuPages.COLOR_WHEEL] = new ColorWheelPage(this);
        this._pages[MenuPages.EDITOR_SETTINGS] = new EditorSettingsPage(this);
        this._pages[MenuPages.INSTANCE] = new InstancePage(this);
        this._pages[MenuPages.LIBRARY] = new LibraryPage(this);
        this._pages[MenuPages.LIBRARY_SEARCH] = new LibrarySearchPage(this);
        this._pages[MenuPages.LOAD_GDRIVE] = new LoadFromGDrivePage(this);
        this._pages[MenuPages.MATERIAL] = new MaterialPage(this);
        this._pages[MenuPages.MATERIALS] = new MaterialsPage(this);
        this._pages[MenuPages.NAVIGATION] = new NavigationPage(this);
        this._pages[MenuPages.NEW_MATERIAL] = new NewMaterialPage(this);
        this._pages[MenuPages.NEW_TEXTURE] = new NewTexturePage(this);
        this._pages[MenuPages.PROJECT] = new ProjectPage(this);
        this._pages[MenuPages.SETTINGS] = new SettingsPage(this);
        this._pages[MenuPages.SKYBOX] = new SkyboxPage(this);
        this._pages[MenuPages.TEXTURE] = new TexturePage(this);
        this._pages[MenuPages.TEXTURES] = new TexturesPage(this);
        this._pages[MenuPages.TEXT_INPUT] = new TextInputPage(this);
        this._pages[MenuPages.UPLOAD] = new UploadPage(this);
        this._pages[MenuPages.USER_SETTINGS] = new UserSettingsPage(this);
        this._pageCalls = [MenuPages.NAVIGATION];
        this._gripInteractable = MenuGripInteractable.emptyGroup();
        this._gripOwners = new Set();
        this._eventAlreadyTriggered = false;
        this._addEventListeners();
        this._setupNotificationHub();
        this._createPointerInteractables();
        if(global.deviceType == 'XR') {
            this._pages[MenuPages.HANDS] = new HandsPage(this);
            this._createGripInteractables();
            Keyboard.init(this._object);
        }
    }

    _addEventListeners() {
        let menuToggle = document.getElementById("mobile-menu-open-button")
        menuToggle.addEventListener('click', () => { this._openMenu() });
    }

    _setupNotificationHub() {
        this._notificationHub = new NotificationHub();
        this._notificationHub.addToScene(this._object);
        this._notificationHub.setNotificationHeight(0.18);
    }

    _getCurrentPage() {
        return this._pages[this._pageCalls[this._pageCalls.length-1]];
    }

    getPage(page) {
        return this._pages[page];
    }

    setPage(page) {
        let currentPage = this._getCurrentPage();
        currentPage.removeFromScene();
        this._pageCalls = [page];
        currentPage = this._getCurrentPage();
        currentPage.addToScene(this._object, this._pointerInteractable);
    }

    pushPage(page) {
        let currentPage = this._getCurrentPage();
        currentPage.removeFromScene();
        this._pageCalls.push(page);
        this._pages[page].addToScene(this._object, this._pointerInteractable);
    }

    popPage() {
        let currentPage = this._getCurrentPage();
        currentPage.removeFromScene();
        this._pageCalls.pop();
        currentPage = this._getCurrentPage();
        currentPage.addToScene(this._object, this._pointerInteractable);
    }

    popPagesPast(page) {
        let poppedPage, currentPage;
        do {
            currentPage = this._getCurrentPage();
            poppedPage = this._pageCalls[this._pageCalls.length-1];
            currentPage.back();
        } while(poppedPage != page);
    }

    back() {
        this._getCurrentPage().back();
    }

    _createBorder() {
        let indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0]);
		let positions = [0.225, 0.15, 0, -0.225, 0.15, 0, -0.225, -0.15, 0, 0.225, -0.15, 0];
		let geometry = new THREE.BufferGeometry();
		geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        let lineSegments = new THREE.LineSegments( geometry );
        lineSegments.material.color.set(0xffff00);
        return lineSegments;
    }

    _createPointerInteractables() {
        UndoRedoHandler.addButtons(this._object, this._pointerInteractable);
    }

    _createGripInteractables() {
        let border = this._createBorder();
        let interactable = new MenuGripInteractable(this._object,
            border,
            (hand) => {
                UserController.hands[hand].attach(this._object);
                this._gripOwners.add(hand);
            }, (hand) => {
                UserController.hands[hand].remove(this._object);
                this._gripOwners.delete(hand);
            }
        );
        this._gripInteractable.addChild(interactable);
    }

    getPosition(vector3) {
        return this._object.getWorldPosition(vector3);
    }

    getPositionArray() {
        return this._object.getWorldPosition(vector3s[0]).toArray();
    }

    getRotationArray() {
        return euler.setFromQuaternion(this._object.getWorldQuaternion(quaternion).normalize()).toArray();
    }

    getDirection(vector3) {
        return this._object.getWorldDirection(vector3);
    }

    update(timeDelta) {
        if(global.deviceType == "XR") {
            this._updateVR(timeDelta);
            this.update = this._updateVR;
        } else if(global.deviceType == "POINTER") {
            this._updatePointer(timeDelta);
            this.update = this._updatePointer;
        } else if(global.deviceType == "MOBILE") {
            this._updateMobile(timeDelta);
            this.update = this._updateMobile;
        }
    }

    _openMenu() {
        global.renderer.getSize(vector2);
        let aspectRatio = vector2.x / vector2.y;
        let menuDistanceScale = (aspectRatio > 1.15)
            ? 1.5
            : 1.5 * aspectRatio;
        global.camera.getWorldPosition(vector3s[0]);
        global.camera.getWorldDirection(vector3s[1]);
        vector3s[1].normalize().divideScalar(menuDistanceScale);
        this._object.position.addVectors(vector3s[0], vector3s[1]);
        this._object.lookAt(vector3s[0]);
        //this._object.add(this._object);
        this.addToScene(this._scene);
    }

    closeMenu() {
        //this._object.remove(this._object);
        this.removeFromScene();
    }

    _updateVR(timeDelta) {
        if(global.sessionActive) {
            let rightGamepad = InputHandler.getXRGamepad(Hands.RIGHT);
            let leftGamepad = InputHandler.getXRGamepad(Hands.LEFT);
            if(rightGamepad?.buttons[4]?.pressed) {
                if(!this._eventAlreadyTriggered) {
                    this._eventAlreadyTriggered = true;
                    if(this._gripOwners.size == 0) this._openMenu();
                }
            } else if(leftGamepad?.buttons[4]?.pressed) {
                if(!this._eventAlreadyTriggered) {
                    this._eventAlreadyTriggered = true;
                    if(this._gripOwners.size == 0) this._openMenu();
                }
            } else {
                this._eventAlreadyTriggered = false;
            }
        }
        this._notificationHub.update(timeDelta);
    }

    _updatePointer(timeDelta) {
        if(global.sessionActive && !global.keyboardLock) {
            if(InputHandler.isKeyPressed("m")||InputHandler.isKeyPressed("M")) {
                if(!this._eventAlreadyTriggered) {
                    this._eventAlreadyTriggered = true;
                    this._openMenu();
                }
            } else {
                this._eventAlreadyTriggered = false;
            }
        }
        this._notificationHub.update(timeDelta);
    }

    _updateMobile(timeDelta) {
        this._notificationHub.update(timeDelta);
    }

    addToScene(scene) {
        if(this._object.parent == scene) return;
        super.addToScene(scene);
        this._scene = scene;
        this._getCurrentPage().addToScene(this._object,
            this._pointerInteractable);
        if(global.deviceType == "XR")
            GripInteractableHandler.addInteractable(this._gripInteractable);
        PointerInteractableHandler.addInteractable(this._pointerInteractable);
    }

    removeFromScene() {
        super.removeFromScene();
        let currentPage = this._getCurrentPage();
        currentPage.removeFromScene();
        if(global.deviceType == "XR")
            GripInteractableHandler.removeInteractable(this._gripInteractable);
        PointerInteractableHandler.removeInteractable(this._pointerInteractable);
    }
}
