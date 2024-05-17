/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Scene from '/scripts/core/assets/Scene.js';
import EditorMenuController from '/scripts/core/menu/EditorMenuController.js';
import LiveMenuController from '/scripts/core/menu/LiveMenuController.js';
import AmbientLight from '/scripts/core/assets/primitives/AmbientLight.js';
import UserController from '/scripts/core/assets/UserController.js';
import GoogleDrive from '/scripts/core/clients/GoogleDrive.js';
import ReadyPlayerMe from '/scripts/core/clients/ReadyPlayerMe.js';
import InteractionTools from '/scripts/core/enums/InteractionTools.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';
import TransformControlsHandler from '/scripts/core/handlers/TransformControlsHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import RotateHandler from '/scripts/core/handlers/hands/RotateHandler.js';
import ScaleHandler from '/scripts/core/handlers/hands/ScaleHandler.js';
import TranslateHandler from '/scripts/core/handlers/hands/TranslateHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import global from '/scripts/core/global.js';
import * as DigitalBaconUI from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';
import Stats from '/node_modules/three/examples/jsm/libs/stats.module.js';
import * as THREE from 'three';

export default class Main {
    constructor(callback, containerId, params) {
        this._renderer;
        this._camera;
        this._scene = Scene.object;
        this._clock = new THREE.Clock();
        this._container = document.getElementById(containerId);
        this._loadingMessage = document.querySelector('#digital-bacon-loading');
        this._errorMessage = document.querySelector('#digital-bacon-error');
        this._callback = callback;

        this._createRenderer();
        this._createCamera();
        this._createUser();
        this._setupDigitalBaconUI();
        this._createHandlers(params.onStart);
        this._createClients();
        this._createAssets(params.projectFilePath);
        this._addEventListeners();
        this._onResize();
        this._enableStats();

        this._renderer.setAnimationLoop(() => { this._loading(); });
    }

    _createRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias : true });
        this._container.appendChild(this._renderer.domElement);
        if(global.deviceType == "XR") {
            this._renderer.xr.enabled = true;
        }
        global.renderer = this._renderer;
    }

    _createCamera() {
        let ratio = this._container.clientWidth / this._container.clientHeight;
        this._camera = new THREE.PerspectiveCamera(
            global.deviceType != "XR" ? 45 : 90, //Field of View Angle
            ratio, //Aspect Ratio
            0.1, //Clipping for things closer than this amount
            1000 //Clipping for things farther than this amount
        );
        global.camera = this._camera;
        this._scene.add(this._camera);
    }

    _createUser() {
        if(global.disableImmersion) return;
        this._cameraFocus = new THREE.Object3D();
        if(global.deviceType != "XR") {
            this._cameraFocus.position.setY(1.7); //Height of your eyes
            this._camera.position.setY(0.5);
            this._camera.position.setZ(1.9);
        }
        this._cameraFocus.add(this._camera);
        global.cameraFocus = this._cameraFocus;
        global.userController = UserController;
    }

    _setupDigitalBaconUI() {
        DigitalBaconUI.Keyboard.scale.set(0.4, 0.4, 0.4);
        DigitalBaconUI.InputHandler.enableXRControllerManagement(
            UserController.object);
        DigitalBaconUI.init(this._container, this._renderer, this._scene,
            this._camera, global.deviceType, this._cameraFocus);
    }

    _createHandlers(onStart) {
        AudioHandler.init();
        if(global.disableImmersion) return;
        SessionHandler.init(this._container, () => {
            DigitalBaconUI.GripInteractableHandler.addInteractable(
                Scene.gripInteractable);
            DigitalBaconUI.PointerInteractableHandler.addInteractable(
                Scene.pointerInteractable);
            DigitalBaconUI.TouchInteractableHandler.addInteractable(
                Scene.touchInteractable);
            if(onStart) onStart();
        });
        DigitalBaconUI.InteractionToolHandler.setTool(InteractionTools.EDIT);
        TransformControlsHandler.init(this._renderer.domElement, this._camera,
            this._scene);
    }

    _createClients() {
        if(global.disableImmersion) return;
        if(global.isEditor) GoogleDrive.init();
        ReadyPlayerMe.init(this._container);
    }

    _createAssets(projectFilePath) {
        if(projectFilePath) {
            let lock = uuidv4();
            global.loadingLocks.add(lock);
            ProjectHandler.load(projectFilePath, () => {
                if(!global.disableImmersion) this._setupForImmersion();
                global.loadingLocks.delete(lock);
            }, (error) => {
                this._loadingMessage.classList.remove("loading");
                this._errorMessage.classList.add("error");
                if(error) throw error;
            });
        } else {
            let ambientLight = new AmbientLight({ 'visualEdit': false });
            ProjectHandler.addAsset(ambientLight, true, true);
            if(!global.disableImmersion) this._setupForImmersion();
        }
    }

    _setupForImmersion() {
        UndoRedoHandler.init();
        this._menuController = global.isEditor
            ? new EditorMenuController()
            : new LiveMenuController();
        global.menuController = this._menuController;

        ProjectHandler.addAsset(UserController, true, true);
        UserController.init();
        UserController.object.add(this._cameraFocus);
    }

    _addEventListeners() {
        window.addEventListener('resize', () => { this._onResize(); });
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
                this._loadingMessage.children[0].innerHTML = "&nbsp;";
                this._loadingMessage.classList.add("ending");
                setTimeout(() => {
                    this._loadingMessage.classList.remove("loading");
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
                this._renderer.setAnimationLoop((time, frame) => {
                    global.frame = frame;
                    DigitalBaconUI.InputHandler.update(frame);
                    this._update();
                });
            } else if (global.deviceType == "POINTER") {
                this._renderer.setAnimationLoop(() => {
                    this._update();
                });
            } else if (global.deviceType == "TOUCH_SCREEN") {
                this._renderer.setAnimationLoop(() => {
                    this._update();
                });
            }
            global.dynamicAssets.add(this._menuController);
            global.dynamicAssets.add(UserController);
            global.dynamicAssets.add(PartyHandler);
            if(global.isEditor) {
                global.dynamicAssets.add(TranslateHandler);
                global.dynamicAssets.add(RotateHandler);
                global.dynamicAssets.add(ScaleHandler);
            }
            global.dynamicAssets.add(DigitalBaconUI.PointerInteractableHandler);
            if(global.deviceType == "XR") {
                global.dynamicAssets.add(
                    DigitalBaconUI.GripInteractableHandler);
                global.dynamicAssets.add(
                    DigitalBaconUI.TouchInteractableHandler);
            }
            global.dynamicAssets.add(DigitalBaconUI.UpdateHandler);
            if(this._callback) this._callback(this);
        } else {
            this._loadingMessage.children[0].innerHTML = "Loading "
                + global.loadingLocks.size + " more asset(s)";
        }
    }

    _update() {
        this._stats.begin();
        let timeDelta = this._clock.getDelta();
        for(let asset of global.dynamicAssets) {
            asset.update(timeDelta);
        }
        PubSub.update(timeDelta);
        this._renderer.render(this._scene, this._camera);
        this._stats.end();
    }

    getRenderer() {
        return this._renderer;
    }

    getScene() {
        return this._scene;
    }
}
