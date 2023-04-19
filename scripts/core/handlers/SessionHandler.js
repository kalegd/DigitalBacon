/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AudioHandler from '/scripts/core/handlers/AudioHandler.js';
import InputHandler from '/scripts/core/handlers/InputHandler.js';
import { VRButton } from '/node_modules/three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from '/scripts/three/examples/jsm/controls/OrbitControls.js';
import { Vector3 } from 'three';

const MOBILE_OVERRIDE = 'DigitalBacon:MobileOverride';

class SessionHandler {
    init(container, onStart) {
        this._container = container;
        this._orbitControlsTarget = new Vector3(0,0,0);
        this._onStart = onStart;
        global.sessionActive = false;
        if(global.deviceType == "XR") {
            this._configureForXR();
        } else if(global.deviceType == "POINTER") {
            this._configureForPointer();
        } else if(global.deviceType == "MOBILE") {
            this._configureForMobile();
        }
    }

    _configureForXR() {
        this._div = document.createElement('div');
        this._button = VRButton.createButton(global.renderer);
        this._button.removeAttribute('style');
        this._stylizeElements();
        this._button.style.minWidth = '150px';
        this._div.appendChild(this._button);
        this._div.appendChild(this._createMobileOverrideLink());
        global.renderer.xr.addEventListener("sessionstart", () => {
            global.sessionActive = true;
            AudioHandler.init();
            global.renderer.xr.setFoveation(0);
            if(this._onStart) {
                this._onStart();
                this._onStart = null;
            }
        });
        global.renderer.xr.addEventListener("sessionend", () => {
            global.sessionActive = false;
        });
    }

    _configureForPointer() {
        this._div = document.createElement('div');
        this._button = document.createElement('button');
        this._button.innerText = "CLICK TO START";
        this._stylizeElements();
        this._div.appendChild(this._button);

        this._controls = new OrbitControls(global.camera,
            global.renderer.domElement);
        this._controls.target = this._orbitControlsTarget;
        this._controls.enableKeys = false;
        this._controls.maxPolarAngle = Math.PI-0.3;
        this._controls.minPolarAngle = 0.3;
        this._controls.minDistance = 0.05;
        this._controls.enablePan = false;
        this._controls.enabled = false;
        this._controls.rotateDelay = 20;
        this._controlsUpdateNumber = 0;
        this._controls.addEventListener('change', () => {
            this._controlsUpdateNumber++;
        });
        this._button.addEventListener('click', () => {
            this._div.style.display = "none";
            this._controls.enabled = true;
            global.sessionActive = true;
            AudioHandler.init();
            InputHandler.createPointerControls();
            if(this._onStart) {
                this._onStart();
                this._onStart = null;
            }
        });
    }

    _configureForMobile() {
        this._div = document.createElement('div');
        this._button = document.createElement('button');
        this._button.innerText = "TAP TO START";
        this._stylizeElements();
        this._div.appendChild(this._button);
        if(localStorage.getItem(MOBILE_OVERRIDE))
            this._div.appendChild(this._createVROverrideLink());

        this._controls = new OrbitControls(global.camera,
            global.renderer.domElement);
        this._controls.target = this._orbitControlsTarget;
        this._controls.maxPolarAngle = Math.PI-0.3;
        this._controls.minPolarAngle = 0.3;
        this._controls.minDistance = 0.05;
        this._controls.enablePan = false;
        this._controls.enabled = false;
        this._controls.rotateDelay = 20;
        this._controlsUpdateNumber = 0;
        this._controls.addEventListener('change', () => {
            this._controlsUpdateNumber++;
        });
        this._button.addEventListener('click', () => {
            this._div.style.display = "none";
            this._controls.enabled = true;
            global.sessionActive = true;
            AudioHandler.init();
            InputHandler.createMobileControls();
            if(this._onStart) {
                this._onStart();
                this._onStart = null;
            }
        });
    }

    _stylizeElements() {
        this._div.style.position = 'absolute';
        this._div.style.top = '75%';
        this._div.style.transform = 'translateY(-50%)';
        this._div.style.width = '100%';
        this._div.style.textAlign = 'center';
        this._div.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this._div.style.padding = '10px 0';
        this._button.style.padding = '12px';
        this._button.style.border = '2px solid #ffc7e5';
        this._button.style.borderRadius = '4px';
        this._button.style.background = 'none';
        this._button.style.color = '#ffc7e5';
        this._button.style.font = 'normal 18px sans-serif';
        this._button.style.outline = 'none';
        this._button.style.transition = 'background-color .15s ease-in-out';
        this._button.onmouseenter = () => {
            this._button.style.cursor = 'pointer';
            this._button.style.background = 'rgba(0, 0, 0, 0.5)';
        };
        this._button.onmouseleave = () => {
            this._button.style.cursor = 'inherit';
            this._button.style.background = 'none';
        };
    }

    _createMobileOverrideLink() {
        let a = document.createElement('a');
        a.innerText = 'Use Touchscreen Controls';
        a.href = '#';
        a.style.display = 'block';
        a.style.paddingTop = '12px';
        a.style.color = 'rgb(255, 199, 229)';
        a.addEventListener('click', () => {
            event.preventDefault();
            localStorage.setItem(MOBILE_OVERRIDE, true);
            window.location.reload();
        });
        return a;
    }

    _createVROverrideLink() {
        let a = document.createElement('a');
        a.innerText = 'Use VR Controls';
        a.href = '#';
        a.style.display = 'block';
        a.style.paddingTop = '12px';
        a.style.color = 'rgb(255, 199, 229)';
        a.addEventListener('click', () => {
            event.preventDefault();
            localStorage.removeItem(MOBILE_OVERRIDE);
            window.location.reload();
        });
        return a;
    }

    displayButton() {
        this._container.appendChild(this._div);
    }

    exitXRSession() {
        this._button.click();
    }

    enableOrbit() {
        if(this._controls) this._controls.enableRotate = true;
    }

    disableOrbit() {
        if(this._controls) this._controls.enableRotate = false;
    }

    getControlsUpdateNumber() {
        return this._controlsUpdateNumber;
    }

    getCameraDistance() {
        if(this._controls) return this._controls.getDistance();
    }
}

let sessionHandler = new SessionHandler();
export default sessionHandler;
