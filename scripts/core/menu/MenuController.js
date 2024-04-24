/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Scene from '/scripts/core/assets/Scene.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import PointerInteractable from '/scripts/core/interactables/OrbitDisablingPointerInteractable.js';
import NotificationHub from '/scripts/core/menu/NotificationHub.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import MenuGripInteractable from '/scripts/core/interactables/MenuGripInteractable.js';
import { vector2, vector3s, euler, quaternion } from '/scripts/core/helpers/constants.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { GripInteractableHandler, PointerInteractableHandler, TouchInteractableHandler, TouchInteractable, Handedness, InputHandler } from '/scripts/DigitalBacon-UI.js';
import * as THREE from 'three';

export default class MenuController {
    constructor() {
        this._id = uuidv4();
        this._object = new THREE.Object3D();
        this._object.position.setZ(-100);
        this._object.addEventListener('added', () => this._onAdded());
        this._object.addEventListener('removed', () => this._onRemoved());
        this._createInteractables();
        this._pages = {};
        this._pageCalls = [];
        this._gripOwners = new Set();
        this._eventAlreadyTriggered = false;
        this._addEventListeners();
        this._setupNotificationHub();
    }

    _addEventListeners() {
        let menuToggle = document.getElementById("mobile-menu-open-button");
        menuToggle.addEventListener('click', () => { this._openMenu(); });
        PubSub.subscribe(this._id, PubSubTopics.SESSION_STARTED, () => {
            if(global.deviceType != 'XR') menuToggle.classList.remove("hidden");
        });
    }

    _setupNotificationHub() {
        this._notificationHub = new NotificationHub();
        this._object.add(this._notificationHub);
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
        if(currentPage.parent) currentPage.parent.remove(currentPage);
        this._pageCalls = [page];
        currentPage = this.getCurrentPage();
        this._object.add(currentPage);
    }

    pushPage(page) {
        let currentPage = this.getCurrentPage();
        if(currentPage.parent) currentPage.parent.remove(currentPage);
        this._pageCalls.push(page);
        this._object.add(this._pages[page]);
    }

    popPage() {
        if(this._pageCalls.length <= 1) return;
        let currentPage = this.getCurrentPage();
        if(currentPage.parent) currentPage.parent.remove(currentPage);
        this._pageCalls.pop();
        currentPage = this.getCurrentPage();
        this._object.add(currentPage);
    }

    popPagesPast(page) {
        let poppedPage, currentPage;
        do {
            currentPage = this.getCurrentPage();
            poppedPage = this._pageCalls[this._pageCalls.length-1];
            currentPage.back();
        } while(poppedPage != page);
    }

    popAllPages() {
        while(this._pageCalls.length > 1) {
            let currentPage = this.getCurrentPage();
            currentPage.back();
        }
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
        new PointerInteractable(this._object);
        new TouchInteractable(this._object);
        if(global.deviceType != 'XR') return;
        let border = this._createBorder();
        let interactable = new MenuGripInteractable(this._object, border);
        interactable.addEventListener('down', (message) => {
            interactable.capture(message.owner);
            let asset = ProjectHandler.getAsset(message.owner.id);
            if(asset) asset.object.attach(this._object);
            this._gripOwners.add(message.owner.id);
        });
        interactable.addEventListener('click', (message) => {
            let asset = ProjectHandler.getAsset(message.owner.id);
            if(this._object.parent == asset.object)
                Scene.object.attach(this._object);
            this._gripOwners.delete(message.owner.id);
        });
    }

    getPosition(vector3) {
        return this._object.getWorldPosition(vector3);
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
        } else if(global.deviceType == "TOUCH_SCREEN") {
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
        Scene.object.add(this._object);
    }

    closeMenu() {
        if(this._object.parent) this._object.parent.remove(this._object);
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

    _onAdded() {
        if(global.deviceType == "XR") {
            GripInteractableHandler.addInteractable(
                this._object.gripInteractable);
            TouchInteractableHandler.addInteractable(
                this._object.touchInteractable);
        }
        PointerInteractableHandler.addInteractable(
            this._object.pointerInteractable);
    }

    _onRemoved() {
        if(global.deviceType == "XR") {
            GripInteractableHandler.removeInteractable(
                this._object.gripInteractable);
            TouchInteractableHandler.removeInteractable(
                this._object.touchInteractable);
        }
        PointerInteractableHandler.removeInteractable(
            this._object.pointerInteractable);
    }
}
