/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '../../../scripts/core/global.js';
import XRPlanes from '../../../scripts/core/assets/XRPlanes.js';
import PubSubTopics from '../../../scripts/core/enums/PubSubTopics.js';
import AudioHandler from '../../../scripts/core/handlers/AudioHandler.js';
import InputHandler from '../../../scripts/core/handlers/InputHandler.js';
import PubSub from '../../../scripts/core/handlers/PubSub.js';
import { OrbitControls } from '../../../scripts/three/examples/jsm/controls/OrbitControls.js';
import { Vector3 } from 'three';

const MOBILE_OVERRIDE = 'DigitalBacon:MobileOverride';
const AR_OPTIONS = {
    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking',
                       'layers', 'anchors', 'plane-detection']
};
const VR_OPTIONS = {
    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking','layers']
};
const XR_OPTIONS = {
    AR: AR_OPTIONS,
    VR: VR_OPTIONS,
};

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
        this._addBakedWithLabel();
    }

    _addBakedWithLabel() {
        this._bakedWithLabel = document.createElement('p');
        this._bakedWithLabel.innerHTML = 'Baked with <a style="color: rgb(255, 199, 229);" href="https://digitalbacon.io">Digital Bacon</a> &#10084;';
        this._bakedWithLabel.style.color = 'rgb(255, 199, 229)';
        this._bakedWithLabel.style.bottom = '0';
        this._bakedWithLabel.style.fontSize = '12px';
        this._bakedWithLabel.style.fontStyle = 'italic';
        this._bakedWithLabel.style.position = 'absolute';
        this._bakedWithLabel.style.width = '100%';
    }

    _configureForXR() {
        this._div = document.createElement('div');
        if(global.vrSessionSupported) this._createXRButton('VR');
        if(global.arSessionSupported) this._createXRButton('AR');
        this._div.appendChild(this._createMobileOverrideLink());
        global.renderer.xr.addEventListener('planesdetected', (event) => {
            XRPlanes.updatePlanes(event);
        });
        global.renderer.xr.addEventListener("sessionstart", () => {
            global.sessionActive = true;
            AudioHandler.resume();
            global.renderer.xr.setFoveation(0);
            if(global.xrSessionType == 'AR') XRPlanes.addToScene(global.scene);
            PubSub.publish(null, PubSubTopics.SESSION_STARTED);
            if(this._onStart) {
                this._onStart();
                this._onStart = null;
            }
        });
        global.renderer.xr.addEventListener("sessionend", () => {
            XRPlanes.removeFromScene();
            PubSub.publish(null, PubSubTopics.SESSION_ENDED);
            global.sessionActive = false;
            AudioHandler.suspend();
        });
    }

    _createXRButton(xrSessionType) {
        let isVR = xrSessionType == 'VR';
        let button = document.createElement('button');
        button.innerText = isVR ? 'ENTER VR' : 'START AR';
        this._stylizeElements(button);
        button.style.minWidth = '150px';
        this._div.appendChild(button);
        let onSessionEnded = () => {
            this._currentSession.removeEventListener( 'end', onSessionEnded );
            button.innerText = isVR ? 'ENTER VR' : 'START AR';
            this._currentSession = null;
        };
        let onSessionStarted = async (session) => {
            session.addEventListener( 'end', onSessionEnded );
            await global.renderer.xr.setSession( session );
            button.innerText = isVR ? 'EXIT VR' : 'STOP AR';
            this._currentSession = session;
        };
        button.addEventListener('click', () => {
            if(this._currentSession) {
                this._currentSession.end();
            } else {
                global.xrSessionType = xrSessionType;
                let mode = isVR ? 'immersive-vr' : 'immersive-ar';
                if(!isVR) {
                    this._update = this._createAnchor;
                    global.dynamicAssets.add(this);
                }
                navigator.xr.requestSession(mode, XR_OPTIONS[xrSessionType])
                    .then(onSessionStarted);
            }
        });
    }

    _configureForPointer() {
        this._div = document.createElement('div');
        this._button = document.createElement('button');
        this._button.innerText = "CLICK TO START";
        this._stylizeElements(this._button);
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
            this._bakedWithLabel.style.display = "none";
            this._controls.enabled = true;
            global.sessionActive = true;
            AudioHandler.resume();
            InputHandler.createPointerControls();
            PubSub.publish(null, PubSubTopics.SESSION_STARTED);
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
        this._stylizeElements(this._button);
        this._div.appendChild(this._button);
        if(localStorage.getItem(MOBILE_OVERRIDE))
            this._div.appendChild(this._createXROverrideLink());

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
            this._bakedWithLabel.style.display = "none";
            this._controls.enabled = true;
            global.sessionActive = true;
            AudioHandler.resume();
            InputHandler.createMobileControls();
            PubSub.publish(null, PubSubTopics.SESSION_STARTED);
            if(this._onStart) {
                this._onStart();
                this._onStart = null;
            }
        });
    }

    _stylizeElements(button) {
        this._div.style.position = 'absolute';
        this._div.style.top = '75%';
        this._div.style.transform = 'translateY(-50%)';
        this._div.style.width = '100%';
        this._div.style.textAlign = 'center';
        this._div.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this._div.style.padding = '10px 0';
        button.style.padding = '12px';
        button.style.border = '2px solid #ffc7e5';
        button.style.borderRadius = '4px';
        button.style.background = 'none';
        button.style.color = '#ffc7e5';
        button.style.font = 'normal 18px sans-serif';
        button.style.margin = '0 4px';
        button.style.outline = 'none';
        button.style.transition = 'background-color .15s ease-in-out';
        button.onmouseenter = () => {
            button.style.cursor = 'pointer';
            button.style.background = 'rgba(0, 0, 0, 0.5)';
        };
        button.onmouseleave = () => {
            button.style.cursor = 'inherit';
            button.style.background = 'none';
        };
    }

    _createMobileOverrideLink() {
        let a = document.createElement('a');
        a.innerText = 'Use Touchscreen Controls';
        a.href = '#';
        a.style.display = 'block';
        a.style.paddingTop = '12px';
        a.style.color = 'rgb(255, 199, 229)';
        a.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.setItem(MOBILE_OVERRIDE, true);
            window.location.reload();
        });
        return a;
    }

    _createXROverrideLink() {
        let a = document.createElement('a');
        a.innerText = 'Use AR/VR Controls';
        a.href = '#';
        a.style.display = 'block';
        a.style.paddingTop = '12px';
        a.style.color = 'rgb(255, 199, 229)';
        a.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem(MOBILE_OVERRIDE);
            window.location.reload();
        });
        return a;
    }

    displayButton() {
        this._container.appendChild(this._div);
        this._container.appendChild(this._bakedWithLabel);
    }

    exitXRSession() {
        this._currentSession.end();
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

    update() {
        this._update();
    }

    _createAnchor() {
        if(!global.frame || !global.frame.createAnchor) return;
        console.log("Setting up anchor");
        let pose = new XRRigidTransform({ x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0, w: 1 });
        let referenceSpace = global.renderer.xr.getReferenceSpace();
        global.frame.createAnchor(pose, referenceSpace).then(
            (anchor) => this._anchor = anchor );
        referenceSpace.onreset = () => {
            if(global.xrSessionType != 'AR') return;
            global.dynamicAssets.add(this);
        };
        global.dynamicAssets.delete(this);
        this._update = this._updateReferenceSpace;
    }

    _updateReferenceSpace() {
        if(!this._anchor || !global.frame) return;//Sucks to suck :(
        let space = global.renderer.xr.getReferenceSpace();
        let pose = global.frame.getPose(this._anchor.anchorSpace, space);
        if(!pose) return;//Still sucks to suck :(
        let newSpace = space.getOffsetReferenceSpace(pose.transform);
        global.renderer.xr.setReferenceSpace(newSpace);
        global.dynamicAssets.delete(this);
    }
}

let sessionHandler = new SessionHandler();
export default sessionHandler;
