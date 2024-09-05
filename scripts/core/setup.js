/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import '/scripts/core/handlers/assetTypes/ComponentsHandler.js';
import '/scripts/core/handlers/assetTypes/CustomAssetsHandler.js';
import '/scripts/core/handlers/assetTypes/InternalAssetsHandler.js';
import '/scripts/core/handlers/assetTypes/AudiosHandler.js';
import '/scripts/core/handlers/assetTypes/ImagesHandler.js';
import '/scripts/core/handlers/assetTypes/LightsHandler.js';
import '/scripts/core/handlers/assetTypes/MaterialsHandler.js';
import '/scripts/core/handlers/assetTypes/ModelsHandler.js';
import '/scripts/core/handlers/assetTypes/ShapesHandler.js';
import '/scripts/core/handlers/assetTypes/SystemsHandler.js';
import '/scripts/core/handlers/assetTypes/TextsHandler.js';
import '/scripts/core/handlers/assetTypes/TexturesHandler.js';
import '/scripts/core/handlers/assetTypes/VideosHandler.js';
import '/scripts/core/assets/PeerController.js';
import '/scripts/core/assets/texts/PlainText.js';
import '/scripts/core/assets/texts/TextOverlay.js';
import '/scripts/core/assets/components/PublishComponent.js';
import '/scripts/core/assets/primitives/AmbientLight.js';
import '/scripts/core/assets/primitives/BoxShape.js';
import '/scripts/core/assets/primitives/CircleShape.js';
import '/scripts/core/assets/primitives/ConeShape.js';
import '/scripts/core/assets/primitives/CylinderShape.js';
import '/scripts/core/assets/primitives/PlaneShape.js';
import '/scripts/core/assets/primitives/PointLight.js';
import '/scripts/core/assets/primitives/RingShape.js';
import '/scripts/core/assets/primitives/SphereShape.js';
import '/scripts/core/assets/primitives/SpotLight.js';
import '/scripts/core/assets/primitives/TorusShape.js';
import '/scripts/core/assets/primitives/DirectionalLight.js';
import '/scripts/core/assets/primitives/HemisphereLight.js';
import '/scripts/core/assets/materials/BasicMaterial.js';
import '/scripts/core/assets/materials/StandardMaterial.js';
import '/scripts/core/assets/materials/ToonMaterial.js';
import '/scripts/core/assets/systems/PublishSystem.js';
import '/scripts/core/assets/textures/BasicTexture.js';
import '/scripts/core/assets/textures/CubeTexture.js';
import '/scripts/core/helpers/editor/AssetEntityHelper.js';
import '/scripts/core/helpers/editor/AudioAssetHelper.js';
import '/scripts/core/helpers/editor/BasicMaterialHelper.js';
import '/scripts/core/helpers/editor/BasicTextureHelper.js';
import '/scripts/core/helpers/editor/ComponentHelper.js';
import '/scripts/core/helpers/editor/PublishComponentHelper.js';
import '/scripts/core/helpers/editor/ImageAssetHelper.js';
import '/scripts/core/helpers/editor/VideoAssetHelper.js';
import '/scripts/core/helpers/editor/CubeTextureHelper.js';
import '/scripts/core/helpers/editor/CustomAssetHelper.js';
import '/scripts/core/helpers/editor/ModelAssetHelper.js';
import '/scripts/core/helpers/editor/MaterialHelper.js';
import '/scripts/core/helpers/editor/AmbientLightHelper.js';
import '/scripts/core/helpers/editor/TextAssetHelper.js';
import '/scripts/core/helpers/editor/PlainTextHelper.js';
import '/scripts/core/helpers/editor/TextOverlayHelper.js';
import '/scripts/core/helpers/editor/BoxShapeHelper.js';
import '/scripts/core/helpers/editor/CircleShapeHelper.js';
import '/scripts/core/helpers/editor/ConeShapeHelper.js';
import '/scripts/core/helpers/editor/CylinderShapeHelper.js';
import '/scripts/core/helpers/editor/DirectionalLightHelper.js';
import '/scripts/core/helpers/editor/HemisphereLightHelper.js';
import '/scripts/core/helpers/editor/LightHelper.js';
import '/scripts/core/helpers/editor/ShapeHelper.js';
import '/scripts/core/helpers/editor/SpotLightHelper.js';
import '/scripts/core/helpers/editor/PlaneShapeHelper.js';
import '/scripts/core/helpers/editor/PointLightHelper.js';
import '/scripts/core/helpers/editor/RingShapeHelper.js';
import '/scripts/core/helpers/editor/SphereShapeHelper.js';
import '/scripts/core/helpers/editor/TorusShapeHelper.js';
import '/scripts/core/helpers/editor/StandardMaterialHelper.js';
import '/scripts/core/helpers/editor/SystemHelper.js';
import '/scripts/core/helpers/editor/ToonMaterialHelper.js';
import '/node_modules/file-saver/src/FileSaver.js';
import '/node_modules/jszip/dist/jszip.js';
import '/node_modules/jszip-utils/dist/jszip-utils.js';
import Main from '/scripts/core/Main.js';
import { DeviceTypes } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

/* global JSZip */
let currDate = new Date();
JSZip.defaults.date = new Date(currDate.getTime() - currDate.getTimezoneOffset()
        * 60000);
global.deviceType = DeviceTypes.TOUCH_SCREEN;
global.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;

function start(callback, containerId, params) {
    setupContainer(containerId);
    window.main = new Main(callback, containerId, params);
}

function hasPointerLock() {
    let capableOfPointerLock = 'pointerLockElement' in document
        || 'mozPointerLockElement' in document
        || 'webkitPointerLockElement' in document;
    return capableOfPointerLock;
}

//From https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
function detectMobile() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) =>navigator.userAgent.match(toMatchItem));
}

function checkIfPointer() {
    if(hasPointerLock() && !detectMobile()) {
        global.deviceType = DeviceTypes.POINTER;
    }
}

function isARSupported() {
    return navigator.xr.isSessionSupported('immersive-ar')
        .then(function (supported) {
            if(supported) global.arSessionSupported = true;
            return supported;
        }).catch(function() {
            return false;
        });
}

function isVRSupported() {
    return navigator.xr.isSessionSupported('immersive-vr')
        .then(function (supported) {
            if(supported) global.vrSessionSupported = true;
            return supported;
        }).catch(function() {
            return false;
        });
}

//Yuck, css and html through javascript. But it's easier to import the project
//this way
function setupContainer(containerId) {
    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
#digital-bacon-loading.loading, #digital-bacon-error.error {
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: 100;
    color: #4723D9;
    display: block;
    justify-content: center;
    align-items: center;
}

#digital-bacon-loading, #digital-bacon-error {
    display: none;
}

@keyframes animatedOpacity {
    from { opacity: 1; }
    to { opacity: 0; }
}

#digital-bacon-loading.loading.ending {
    animation: animatedOpacity 1s linear 1 forwards;
}

@keyframes animatedScale {
    0% { transform: scale(1.0); }
    100% { transform: scale(1.1); }
}

#digital-bacon-loading.loading > img {
    width: 25%;
    animation: animatedScale 1s ease-in-out alternate infinite;
}

#mobile-menu-open-button {
    border-width: 1px;
    border-style: solid;
    border-color: #fff;
    border-radius: 4px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    font: normal 13px sans-serif;
    margin-left: 5px;
    opacity: 0.75;
    padding: 12px;
    position: absolute;
    right: 10px;
    top: 10px;
}

#container button:hover {
    opacity: 1;
}

#digital-bacon-transform-controls {
    position: absolute;
    top: 50px;
}

#digital-bacon-transform-controls > button, #ready-player-me-close-button {
    border-width: 1px;
    border-style: solid;
    border-color: #fff;
    border-radius: 4px;
    background: rgba(0,0,0,0.5);
    padding: 12px;
    color: #fff;
    font: normal 13px sans-serif;
    opacity: 0.7;
    width: 95px;
    margin: 2px;
    display: block;
    text-align: left;
}

#digital-bacon-transform-controls > button:hover, #digital-bacon-transform-controls > button.selected {
    opacity: 1;
    font-weight: bold;
    background-color: black;
}

#digital-bacon-transform-controls > button > i {
    font-size: 18px;
    width: 25px;
}

#ready-player-me-close-button {
    position: absolute;
    top: 10%;
    z-index: 1001;
    transform: translateX(-50%);
    width: fit-content;
    display: inline;
}

#digital-bacon-rpm-iframe {
    position: absolute;
    top: 10%;
    left: 0;
    width: 100%;
    height: 80%;
    z-index: 1000;
    border: none;
}

#container .hidden {
    display: none;
}

#container > canvas {
    outline: none;
}
    `.replaceAll("container", containerId);
    if(global.deviceType == DeviceTypes.TOUCH_SCREEN)
        style.innerHTML += `
@media screen and (max-height: 500px) {
    #digital-bacon-transform-controls {
        max-height: calc(100% - 169px);
        overflow: scroll;
    }
}
        `;
    document.getElementsByTagName('head')[0].appendChild(style);
    let lineAwesomeLink = document.createElement('link');
    lineAwesomeLink.rel = 'stylesheet';
    lineAwesomeLink.href = 'https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css';
    document.getElementsByTagName('head')[0].appendChild(lineAwesomeLink);

    let container = document.getElementById(containerId);
    container.innerHTML = `
      <div id="digital-bacon-loading" class="loading">
        <h1>Loading...</h1>
        <img src="images/digital_bacon_pig_compressed.png">
      </div>
      <div id="digital-bacon-error">
        <h1>Error Loading Default Environment</h1>
      </div>
      <div id="digital-bacon-transform-controls" class="hidden">
        <button id="place-button"><i class="las la-map-pin"></i>Place</button>
        <button id="translate-button" class="selected"><i class="las la-arrows-alt"></i>Move</button>
        <button id="rotate-button"><i class="las la-sync"></i>Rotate</button>
        <button id="scale-button"><i class="las la-expand"></i>Scale</button>
        <button id="clone-button"><i class="las la-copy"></i>Clone</button>
        <button id="delete-button"><i class="las la-trash"></i>Delete</button>
        <button id="close-button"><i class="las la-times-circle"></i>Close</button>
      </div>
      <button id="mobile-menu-open-button" class="hidden">OPEN MENU</button>`;
    container.style.position = 'relative';
}

function setupEditor(containerId, params) {
    global.isEditor = true;
    return setup(containerId, params);
}

function setup(containerId, params) {
    params = params || {};
    global.authUrl = params.authUrl;
    global.socketUrl = params.socketUrl;
    let promise = new Promise((resolve) => {
        //Check mobile override for VR capable phones
        if(localStorage.getItem('DigitalBacon:MobileOverride')) {
            start(resolve, containerId, params);
            return;
        } else if(localStorage.getItem('DigitalBacon:PointerOverride')) {
            global.deviceType = DeviceTypes.POINTER;
            start(resolve, containerId, params);
            return;
        }
        if('xr' in navigator) {
            isVRSupported().then((vrSupported) => {
                isARSupported().then((arSupported) => {
                    if(vrSupported || arSupported) {
                        global.deviceType = DeviceTypes.XR;
                    } else {
                        checkIfPointer();
                    }
                }).finally(function() {
                    start(resolve, containerId, params);
                });
            });
        } else {
            checkIfPointer();
            start(resolve, containerId, params);
        }
    });
    return promise;
}

export { setup, setupEditor };
