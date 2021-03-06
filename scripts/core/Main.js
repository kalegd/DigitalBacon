/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import MenuController from '/scripts/core/menu/MenuController.js';
import PrimitiveAmbientLight from '/scripts/core/assets/PrimitiveAmbientLight.js';
import UserController from '/scripts/core/assets/UserController.js';
import GoogleDrive from '/scripts/core/clients/GoogleDrive.js';
import ReadyPlayerMe from '/scripts/core/clients/ReadyPlayerMe.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import global from '/scripts/core/global.js';
import Stats from '/node_modules/three/examples/jsm/libs/stats.module.js';
import ThreeMeshUI from 'three-mesh-ui';
import * as THREE from 'three';

export default class Main {
    constructor(callback, containerId, projectFilePath) {
        this._renderer;
        this._scene;
        this._camera;
        this._clock = new THREE.Clock();
        this._container = document.getElementById(containerId);
        this._loadingMessage = document.querySelector('#digital-bacon-loading');
        this._errorMessage = document.querySelector('#digital-bacon-error');
        this._dynamicAssets = [];
        this._callback = callback;

        this._createRenderer();
        this._createScene();
        this._createCamera();
        this._createUser();
        this._createHandlers();
        this._createClients();
        this._createAssets(projectFilePath);
        this._addEventListeners();
        this._onResize();
        this._enableStats();

        this._renderer.setAnimationLoop(() => { this._loading() });
    }

    _createRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias : true });
        this._container.appendChild(this._renderer.domElement);
        if(global.deviceType == "XR") {
            this._renderer.xr.enabled = true;
        }
        global.renderer = this._renderer;
    }

    _createScene() {
        this._scene = new THREE.Scene();
        global.scene = this._scene;
    }

    _createCamera() {
        this._camera = new THREE.PerspectiveCamera(
            45, //Field of View Angle
            this._container.clientWidth / this._container.clientHeight, //Aspect Ratio
            0.1, //Clipping for things closer than this amount
            1000 //Clipping for things farther than this amount
        );
        global.camera = this._camera;
        this._scene.add(this._camera);
    }

    _createUser() {
        if(global.disableImmersion) return;
        this._userObj = new THREE.Object3D();
        this._cameraFocus = new THREE.Object3D();
        if(global.deviceType != "XR") {
            //this._cameraFocus.position.setY(1.7); //Height of your eyes
            this._camera.position.setY(0.5);
            this._camera.position.setZ(1.9);
        }
        this._cameraFocus.add(this._camera);
        this._userObj.add(this._cameraFocus);
        this._scene.add(this._userObj);
        global.cameraFocus = this._cameraFocus;
    }

    _createHandlers() {
        ProjectHandler.init(this._scene);
        if(global.disableImmersion) return;
        SessionHandler.init(this._container);
        InputHandler.init(this._container, this._renderer, this._userObj);
        PointerInteractableHandler.init();
        if(global.deviceType == "XR") GripInteractableHandler.init();
        TransformControlsHandler.init(this._renderer.domElement, this._camera,
            this._scene);
    }

    _createClients() {
        if(global.disableImmersion) return;
        GoogleDrive.init();
        ReadyPlayerMe.init(this._container);
    }

    _createAssets(projectFilePath) {
        if(!global.disableImmersion) {
            this._menuController = new MenuController();
            this._menuController.addToScene(this._scene);
            global.menuController = this._menuController;

            UserController.init({
                'User Object': this._userObj,
                'Flight Enabled': true,
            });
            UserController.addToScene(this._userObj);
        }

        if(projectFilePath) {
            let lock = uuidv4();
            global.loadingLocks.add(lock);
            ProjectHandler.load(projectFilePath, () => {
                global.loadingLocks.delete(lock);
            }, (error) => {
                $(this._loadingMessage).removeClass("loading");
                $(this._errorMessage).addClass("error");
                if(error) throw error;
            });
        } else {
            let ambientLight = new PrimitiveAmbientLight({
                'visualEdit': false,
            });
            ProjectHandler.addLight(ambientLight, ambientLight.getAssetId(), true);
        }
    }

    _addEventListeners() {
        window.addEventListener('resize', () => { this._onResize() });
        if(!global.disableImmersion) {
            this._container.addEventListener('wheel', function(event) {
                        event.preventDefault();
            }, {passive: false, capture: true});
        }
        
    }

    _onResize() {
        this._renderer.setSize(this._container.clientWidth,
            this._container.clientHeight);
        this._camera.aspect = this._container.clientWidth
            / this._container.clientHeight;
        this._camera.updateProjectionMatrix();
    }

    _enableStats() {
        this._stats = new Stats();
        this._stats.showPanel(0);
        this._stats.dom.style.top = '';
        this._stats.dom.style.left = '';
        if(global.isEditor) {
            this._container.insertBefore(this._stats.dom,
                this._container.firstChild);
        }
    }

    _loading() {
        if(global.loadingLocks.size == 0) {
            setTimeout(() => {//Because we should render a frame first
                $(this._loadingMessage.children[0]).html("&nbsp;");
                $(this._loadingMessage).addClass("ending");
                setTimeout(() => {
                    $(this._loadingMessage).removeClass("loading");
                    if(!global.disableImmersion) SessionHandler.displayButton();
                }, 1000);
            }, 50);
            if(global.disableImmersion) {
                this._renderer.setAnimationLoop(() => {
                    this._update();
                });
                if(this._callback) this._callback(this);
                return;
            } else if(global.deviceType == "XR") {
                this._dynamicAssets.push(GripInteractableHandler);
                this._renderer.setAnimationLoop((time, frame) => {
                    InputHandler.update(frame);
                    this._update();
                });
            } else if (global.deviceType == "POINTER") {
                this._renderer.setAnimationLoop(() => {
                    this._update();
                });
            } else if (global.deviceType == "MOBILE") {
                this._renderer.setAnimationLoop(() => {
                    this._update();
                });
            }
            this._dynamicAssets.push(this._menuController);
            this._dynamicAssets.push(UserController);
            this._dynamicAssets.push(PointerInteractableHandler);
            this._dynamicAssets.push(PubSub);
            this._dynamicAssets.push(ThreeMeshUI);
            this._dynamicAssets.push(PartyHandler);
            if(this._callback) this._callback(this);
        } else {
            $(this._loadingMessage.children[0]).html("Loading "
                + global.loadingLocks.size + " more asset(s)");
        }
    }

    _update() {
        this._stats.begin();
        let timeDelta = this._clock.getDelta();
        for(let asset of this._dynamicAssets) {
            asset.update(timeDelta);
        }
        this._renderer.render(this._scene, this._camera);
        this._stats.end();
    }

    getCamera() {
        return this._camera;
    }

    getRenderer() {
        return this._renderer;
    }

    getScene() {
        return this._scene;
    }
}
