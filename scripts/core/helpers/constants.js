/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

import * as THREE from 'three';

//three-mesh-ui doesn't like textures that haven't already been loaded
let icons = ['audio', 'checkmark', 'ellipsis', 'hamburger', 'headphones', 'home', 'image', 'lightbulb', 'material', 'microphone', 'object', 'pencil', 'search', 'shapes', 'texture', 'trash', 'undo', 'redo', 'video'];
let locks = {};
let blackPixelLock = uuidv4();
global.loadingLocks.add(blackPixelLock);
for(let icon of icons) {
    locks[icon] = uuidv4();
    global.loadingLocks.add(locks[icon]);
}
export const Textures = {
    "audioIcon": new THREE.TextureLoader().load(
        'images/icons/audio_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['audio']); },
    ),
    "checkmarkIcon": new THREE.TextureLoader().load(
        'images/icons/checkmark_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['checkmark']); },
    ),
    "ellipsisIcon": new THREE.TextureLoader().load(
        'images/icons/ellipsis_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['ellipsis']); },
    ),
    "hamburgerIcon": new THREE.TextureLoader().load(
        'images/icons/hamburger_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['hamburger']); },
    ),
    "headphonesIcon": new THREE.TextureLoader().load(
        'images/icons/headphones_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['headphones']); },
    ),
    "homeIcon": new THREE.TextureLoader().load(
        'images/icons/home_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['home']); },
    ),
    "imageIcon": new THREE.TextureLoader().load(
        'images/icons/image_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['image']); },
    ),
    "lightbulbIcon": new THREE.TextureLoader().load(
        'images/icons/lightbulb_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['lightbulb']); },
    ),
    "materialIcon": new THREE.TextureLoader().load(
        'images/icons/material_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['material']); },
    ),
    "microphoneIcon": new THREE.TextureLoader().load(
        'images/icons/microphone_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['microphone']); },
    ),
    "objectIcon": new THREE.TextureLoader().load(
        'images/icons/object_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['object']); },
    ),
    "pencilIcon": new THREE.TextureLoader().load(
        'images/icons/pencil_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['pencil']); },
    ),
    "searchIcon": new THREE.TextureLoader().load(
        'images/icons/search_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['search']); },
    ),
    "shapesIcon": new THREE.TextureLoader().load(
        'images/icons/shapes_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['shapes']); },
    ),
    "textureIcon": new THREE.TextureLoader().load(
        'images/icons/texture_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['texture']); },
    ),
    "trashIcon": new THREE.TextureLoader().load(
        'images/icons/trash_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['trash']); },
    ),
    "undoIcon": new THREE.TextureLoader().load(
        'images/icons/undo_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['undo']); },
    ),
    "redoIcon": new THREE.TextureLoader().load(
        'images/icons/redo_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['redo']); },
    ),
    "videoIcon": new THREE.TextureLoader().load(
        'images/icons/video_icon_white.png',
        function(texture) { global.loadingLocks.delete(locks['video']); },
    ),
    "blackPixel": new THREE.TextureLoader().load(
        'images/black_pixel.png',
        function(texture) { global.loadingLocks.delete(blackPixelLock); },
    ),
};

export const Materials = {
    "defaultMeshMaterial": new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
    }),
};

export const Colors = {
    "black": new THREE.Color(0x000000),
    "green": new THREE.Color(0x00ff00),
    "red": new THREE.Color(0xff0000),
    "white": new THREE.Color(0xffffff),
    "yellow": new THREE.Color(0xffff00),
    "defaultIdle": new THREE.Color(0x969696),
    "defaultHovered": new THREE.Color(0x63666b),
    "defaultMenuBackground": new THREE.Color(0x000000),
    "keyboard": new THREE.Color(0x858585),
    "keyboardButtonIdle": new THREE.Color(0x363636),
    "keyboardButtonHovered": new THREE.Color(0x1c1c1c),
    "keyboardButtonSelected": new THREE.Color(0x109c5d),
};

export const Fonts = {
    "defaultFamily": 'https://cdn.jsdelivr.net/npm/msdf-fonts/build/custom/digitalbacon-OpenSans-Regular-msdf.json',
    "defaultTexture": 'https://cdn.jsdelivr.net/npm/msdf-fonts/build/custom/digitalbacon-OpenSans-Regular-msdf.png',
};

export const FontSizes = {
    "header": 0.03,
    "body": 0.02,
}

export const defaultImageSize = 1;

let v1 = new THREE.Vector3();
let v2 = new THREE.Vector3();
let v3 = new THREE.Vector3();

export const vector3s = [v1, v2, v3];
export const vector2 = new THREE.Vector2();
export const euler = new THREE.Euler();
export const quaternion = new THREE.Quaternion();

// For Bounding Box
let indices = new Uint16Array( [ 0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ] );
let positions = [ 1, 1, 1, - 1, 1, 1, - 1, - 1, 1, 1, - 1, 1, 1, 1, - 1, - 1, 1, - 1, - 1, - 1, - 1, 1, - 1, - 1 ];
let geometry = new THREE.BufferGeometry();
geometry.setIndex(new THREE.BufferAttribute(indices, 1));
geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
let material = new THREE.LineBasicMaterial({
    color: Colors.yellow, toneMapped: false });

export const BoundingBox = {
    "geometry": geometry,
    "material": material,
};

//For keys our 2D UI Supports
let validKeysString = " 1234567890`~!@#$%^&*()-_=+[]{}\\|;:'\",.<>/?qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
export const ValidKeys = new Set();
for(let character of validKeysString) {
    ValidKeys.add(character);
}

//For user friendly names of Three.js enums
function fillReverseMap(map, reverseMap) {
    for(let option in map) {
        reverseMap[map[option]] = option;
    }
}

export const COMBINE_MAP = {
    "Multiply": THREE.MultiplyOperation,
    "Mix": THREE.MixOperation,
    "Add": THREE.AddOperation
};
export const MAPPING_MAP = {
    "Reflection": THREE.CubeReflectionMapping,
    "Refraction": THREE.CubeRefractionMapping,
};
export const NORMAL_TYPE_MAP = {
    "Tangent": THREE.TangentSpaceNormalMap,
    "Object": THREE.ObjectSpaceNormalMap,
};
export const SIDE_MAP = {
    "Front Side": THREE.FrontSide,
    "Back Side": THREE.BackSide,
    "Both Sides": THREE.DoubleSide
};
export const WRAP_MAP = {
    "Clamp": THREE.ClampToEdgeWrapping,
    "Repeat": THREE.RepeatWrapping,
    "Mirrored": THREE.MirroredRepeatWrapping
};
export const REVERSE_COMBINE_MAP = {};
export const REVERSE_MAPPING_MAP = {};
export const REVERSE_NORMAL_TYPE_MAP = {};
export const REVERSE_SIDE_MAP = {};
export const REVERSE_WRAP_MAP = {};
fillReverseMap(COMBINE_MAP, REVERSE_COMBINE_MAP);
fillReverseMap(MAPPING_MAP, REVERSE_MAPPING_MAP);
fillReverseMap(NORMAL_TYPE_MAP, REVERSE_NORMAL_TYPE_MAP);
fillReverseMap(SIDE_MAP, REVERSE_SIDE_MAP);
fillReverseMap(WRAP_MAP, REVERSE_WRAP_MAP);
