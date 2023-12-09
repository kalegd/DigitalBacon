/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import Scene from '/scripts/core/assets/Scene.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import NotificationHub from '/scripts/core/menu/NotificationHub.js';
import Keyboard from '/scripts/core/menu/input/Keyboard.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import MenuGripInteractable from '/scripts/core/interactables/MenuGripInteractable.js';
import { vector2, vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

export default class MenuController extends PointerInteractableEntity {
    constructor() {
        super();
        this._object.position.setZ(-100);
        this._pages = {};
        this._pageCalls = [];
        this._gripInteractable = MenuGripInteractable.emptyGroup();
        this._gripOwners = new Set();
        this._eventAlreadyTriggered = false;
        this._addEventListeners();
        this._setupNotificationHub();
        this._createInteractables();
    }

    _addEventListeners() {
        let menuToggle = document.getElementById("mobile-menu-open-button");
        menuToggle.addEventListener('click', () => { this._openMenu(); });
    }

    _setupNotificationHub() {
        this._notificationHub = new NotificationHub();
        this._notificationHub.addToScene(this._object);
        this._notificationHub.setNotificationHeight(0.18);
    }

    getCurrentPage() {
        return this._pages[this._pageCalls[this._pageCalls.length-1]];
    }

    getPage(page) {
        return this._pages[page];
    }

    setPage(page) {
        let currentPage = this.getCurrentPage();
        currentPage.removeFromScene();
        this._pageCalls = [page];
        currentPage = this.getCurrentPage();
        currentPage.addToScene(this._object, this._pointerInteractable);
        PubSub.publish(this._id, PubSubTopics.MENU_PAGE_CHANGED);
    }

    pushPage(page) {
        let currentPage = this.getCurrentPage();
        currentPage.removeFromScene();
        this._pageCalls.push(page);
        this._pages[page].addToScene(this._object, this._pointerInteractable);
        PubSub.publish(this._id, PubSubTopics.MENU_PAGE_CHANGED);
    }

    popPage() {
        let currentPage = this.getCurrentPage();
        currentPage.removeFromScene();
        this._pageCalls.pop();
        currentPage = this.getCurrentPage();
        currentPage.addToScene(this._object, this._pointerInteractable);
        PubSub.publish(this._id, PubSubTopics.MENU_PAGE_CHANGED);
    }

    popPagesPast(page) {
        let poppedPage, currentPage;
        do {
            currentPage = this.getCurrentPage();
            poppedPage = this._pageCalls[this._pageCalls.length-1];
            currentPage.back();
        } while(poppedPage != page);
        PubSub.publish(this._id, PubSubTopics.MENU_PAGE_CHANGED);
    }

    popAllPages() {
        while(this._pageCalls.length > 1) {
            let currentPage = this.getCurrentPage();
            currentPage.back();
        }
        PubSub.publish(this._id, PubSubTopics.MENU_PAGE_CHANGED);
    }

    back() {
        this.getCurrentPage().back();
    }

    _createBorder() {
        let indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0]);
        let positions = [0.225, 0.15, 0, -0.225, 0.15, 0, -0.225, -0.15, 0,
                         0.225, -0.15, 0];
        let geometry = new THREE.BufferGeometry();
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(
            positions, 3));
        let lineSegments = new THREE.LineSegments(geometry);
        lineSegments.material.color.set(0xffff00);
        return lineSegments;
    }

    _createInteractables() {
        if(global.deviceType != 'XR') return;
        let border = this._createBorder();
        let interactable = new MenuGripInteractable(this._object, border);
        interactable.addAction((ownerId) => {
            let asset = ProjectHandler.getAsset(ownerId);
            if(asset) asset.getObject().attach(this._object);
            this._gripOwners.add(ownerId);
        }, (ownerId) => {
            let asset = ProjectHandler.getAsset(ownerId);
            if(this._object.parent == asset.getObject())
                Scene.getObject().attach(this._object);
            this._gripOwners.delete(ownerId);
        });
        this._gripInteractable.addChild(interactable);
        Keyboard.init(this._object);
    }

    getPosition(vector3) {
        return this._object.getWorldPosition(vector3);
    }

    getPositionArray() {
        return this._object.getWorldPosition(vector3s[0]).toArray();
    }

    getRotationArray() {
        return euler.setFromQuaternion(this._object.getWorldQuaternion(
            quaternion).normalize()).toArray();
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
        let userScale = SettingsHandler.getUserScale();
        global.renderer.getSize(vector2);
        let aspectRatio = vector2.x / vector2.y;
        let menuDistanceScale = (aspectRatio > 1.15)
            ? 1.5
            : 1.5 * aspectRatio;
        global.camera.getWorldPosition(vector3s[0]);
        global.camera.getWorldDirection(vector3s[1]);
        vector3s[1].normalize().divideScalar(menuDistanceScale)
            .multiplyScalar(userScale);
        this._object.position.addVectors(vector3s[0], vector3s[1]);
        this._object.lookAt(vector3s[0]);
        this._object.scale.set(userScale, userScale, userScale);
        this.addToScene(this._scene);
    }

    closeMenu() {
        //this._object.remove(this._object);
        this.removeFromScene();
    }

    _updateVR(timeDelta) {
        if(global.sessionActive) {
            let rightGamepad = InputHandler.getXRGamepad(Handedness.RIGHT);
            let leftGamepad = InputHandler.getXRGamepad(Handedness.LEFT);
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
        this.getCurrentPage().addToScene(this._object,
            this._pointerInteractable);
        if(global.deviceType == "XR")
            GripInteractableHandler.addInteractable(this._gripInteractable);
        PointerInteractableHandler.addInteractable(this._pointerInteractable);
    }

    removeFromScene() {
        super.removeFromScene();
        let currentPage = this.getCurrentPage();
        currentPage.removeFromScene();
        if(global.deviceType == "XR")
            GripInteractableHandler.removeInteractable(this._gripInteractable);
        PointerInteractableHandler.removeInteractable(
            this._pointerInteractable);
    }
}
