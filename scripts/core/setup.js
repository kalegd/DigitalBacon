/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Main from '/scripts/core/Main.js';
import global from '/scripts/core/global.js';
import '/scripts/core/assets/PrimitiveAmbientLight.js';
import '/scripts/core/assets/PrimitiveBox.js';
import '/scripts/core/assets/PrimitiveCircle.js';
import '/scripts/core/assets/PrimitiveCone.js';
import '/scripts/core/assets/PrimitiveCylinder.js';
import '/scripts/core/assets/PrimitivePlane.js';
import '/scripts/core/assets/PrimitivePointLight.js';
import '/scripts/core/assets/PrimitiveRing.js';
import '/scripts/core/assets/PrimitiveSphere.js';
import '/scripts/core/assets/PrimitiveTorus.js';
import '/scripts/core/assets/materials/BasicMaterial.js';
import '/scripts/core/assets/materials/LambertMaterial.js';
import '/scripts/core/assets/materials/NormalMaterial.js';
import '/scripts/core/assets/materials/PhongMaterial.js';
import '/scripts/core/assets/materials/StandardMaterial.js';
import '/scripts/core/assets/materials/ToonMaterial.js';
import '/scripts/core/assets/textures/BasicTexture.js';
import '/scripts/core/assets/textures/CubeTexture.js';
import '/node_modules/file-saver/src/FileSaver.js';
import '/node_modules/jszip/dist/jszip.js';
import '/node_modules/jszip-utils/dist/jszip-utils.js';
import '/node_modules/nipplejs/dist/nipplejs.js';

global.deviceType = "MOBILE";
global.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;

function start(callback, containerId, projectFilePath) {
    setupContainer(containerId);
    window.main = new Main(callback, containerId, projectFilePath);
}

function hasPointerLock() {
    let capableOfPointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
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

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

function checkIfPointer() {
    if(hasPointerLock() && !detectMobile()) {
        global.deviceType = "POINTER";
    }
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

#mobile-joystick {
    position: absolute;
    width: 100px;
    height: 100px;
    left: 10px;
    bottom: 10px;
}

#mobile-menu-open-button {
    position: absolute;
    top: 10px;
    right: 10px;
}

#mobile-flying-controls {
    position: absolute;
    bottom: 10px;
    right: 10px;
}

#mobile-flying-controls > button, #mobile-menu-open-button {
    border-width: 1px;
    border-style: solid;
    border-color: #fff;
    border-radius: 4px;
    background: rgba(0,0,0,0.5);
    padding: 12px;
    color: #fff;
    font: normal 13px sans-serif;
    opacity: 0.75;
}

#mobile-flying-controls > button {
    width: 70px;
}

#container button:hover {
    opacity: 1;
}

#transform-controls {
    position: absolute;
    top: 50px;
}

#transform-controls > button, #ready-player-me-close-button {
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

#transform-controls > button:hover, #transform-controls > button.selected {
    opacity: 1;
    font-weight: bold;
    background-color: black;
}

#transform-controls > button > i {
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
    `.replaceAll("container", containerId);
    if(global.deviceType == "MOBILE")
        style.innerHTML += `
@media screen and (max-height: 500px) {
    #transform-controls {
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
      <div id="transform-controls" class="hidden">
        <button id="place-button"><i class="las la-map-pin"></i>Place</button>
        <button id="translate-button" class="selected"><i class="las la-arrows-alt"></i>Move</button>
        <button id="rotate-button"><i class="las la-sync"></i>Rotate</button>
        <button id="scale-button"><i class="las la-expand"></i>Scale</button>
        <button id="clone-button"><i class="las la-copy"></i>Clone</button>
        <button id="delete-button"><i class="las la-trash"></i>Delete</button>
        <button id="close-button"><i class="las la-times-circle"></i>Close</button>
      </div>
      <div id="mobile-joystick" class="hidden"></div>
      <button id="mobile-menu-open-button" class="hidden">OPEN MENU</button>
      <div id="mobile-flying-controls" class="hidden">
        <button id="mobile-flying-up-button">UP</button>
        <button id="mobile-flying-down-button">DOWN</button>
      </div>`;
    container.style.outline = 'none';
    container.style.position = 'relative';
}

function setupEditor(containerId, projectFilePath, partyUrl) {
    global.isEditor = true;
    return setup(containerId, projectFilePath, partyUrl);
}

function setup(containerId, projectFilePath, partyUrl) {
    global.partyUrl = partyUrl;
    let promise = new Promise((resolve) => {
        if('xr' in navigator) {
            navigator.xr.isSessionSupported( 'immersive-vr' )
                .then(function (supported) {
                    if (supported) {
                        global.deviceType = "XR";
                    } else {
                        checkIfPointer();
                    }
                }).catch(function() {
                    checkIfPointer();
                }).finally(function() {
                    start(resolve, containerId, projectFilePath);
                });
        } else {
            checkIfPointer();
            start(resolve, containerId, projectFilePath);
        }
    });
    return promise;
}

export { setup, setupEditor };
