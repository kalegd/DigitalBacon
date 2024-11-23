/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

const DEFAULT_URL = 'https://cdn.jsdelivr.net/npm/digitalbacon@0.3.11/models/default_avatar.glb';
  
export default class Avatar extends InternalAssetEntity {
    constructor(params = {}) {
        params['assetId'] = Avatar.assetId;
        super(params);
        if(params == null) {
            params = {};
        }
        this._isXR = params['isXR'] == true;
        this._avatarParent = new THREE.Object3D();
        this._avatarUrl = params['avatarUrl'] || DEFAULT_URL;
        this._verticalOffset = params['verticalOffset'] || 0;
        this._object.position.setY(this._verticalOffset);
        this._object.add(this._avatarParent);

        this._createMesh(this._avatarUrl);
        let parentAsset = ProjectHandler.getSessionAsset(this._parentId);
        if(parentAsset && parentAsset.registerAvatar) {
            parentAsset.registerAvatar(this);
        }
    }

    _createMesh(filename) {
        if(/\.glb/.test(filename)) {
            let gltfLoader = new GLTFLoader();
            gltfLoader.load(filename, (gltf) => {
                gltf.scene.rotateY(Math.PI);
                if(gltf.scene.children[0].name.includes("AvatarRoot")) {
                    let hands = new Set();
                    let largestZOffset = 0;
                    let eyeOffset = new THREE.Vector3(0, 0.65, 0);
                    let skeleton = gltf.scene.children[0].children[1]?.skeleton;
                    if(skeleton) {
                        let leftEye = skeleton.getBoneByName('LeftEye');
                        let rightEye = skeleton.getBoneByName('RightEye');
                        if(leftEye && rightEye) {
                            leftEye.getWorldPosition(vector3s[0]);
                            rightEye.getWorldPosition(vector3s[1]);
                            eyeOffset.copy(vector3s[0]).add(vector3s[1])
                                .divideScalar(2);
                            eyeOffset.x = 0;
                            if(!this._isXR) eyeOffset.z = 0;
                        }
                    }
                    gltf.scene.traverse((child) => {
                        if(child.name.toLowerCase().includes("hand")) {
                            hands.add(child);
                        }
                        if(child instanceof THREE.Mesh && child.geometry) {
                            let positions = child.geometry.getAttribute(
                                'position');
                            for(let i = 0; i < positions.count; i++) {
                                vector3s[0].fromBufferAttribute(positions, i);

                                if(Math.abs(vector3s[0].y - eyeOffset.y) < 0.1
                                        && Math.abs(vector3s[0].x) < 0.1
                                        && largestZOffset < vector3s[0].z) {
                                    largestZOffset = vector3s[0].z;
                                }
                            }
                        }
                    });
                    hands.forEach((hand) => { hand.parent.remove(hand); });
                    gltf.scene.position.sub(eyeOffset);
                    if(this._isXR && this._object == global.camera
                            && largestZOffset > -eyeOffset.z + 0.1) {
                        //We don't want any facial accessories like glasses or
                        //visors blocking our view
                        global.camera.near = largestZOffset + eyeOffset.z;
                        global.camera.updateProjectionMatrix();
                    }
                }
                this._avatarParent.add(gltf.scene);
                this._saveOriginalTransparencyStates();
                this._dimensions = 3;
            }, () => {}, (error) => {
                console.log(error);
                if(filename != DEFAULT_URL) {
                    this._createMesh(DEFAULT_URL);
                } else {
                    console.error("Can't display default avatar :(");
                }
            });
        } else if(/\.png$|\.jpg$|\.jpeg$/.test(filename)) {
            new THREE.TextureLoader().load(filename, (texture) => {
                let width = texture.image.width;
                let height = texture.image.height;
                if(width > height) {
                    let factor = 0.3 / width;
                    width = 0.3;
                    height *= factor;
                } else {
                    let factor = 0.3 / height;
                    height = 0.3;
                    width *= factor;
                }
                let material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                });
                let geometry = new THREE.PlaneGeometry(width, height);
                geometry.rotateY(Math.PI);
                let mesh = new THREE.Mesh(geometry, material);
                this._avatarParent.add(mesh);
                this._saveOriginalTransparencyStates();
                //let sprite = new THREE.Sprite(material);
                //this._avatarParent.add(sprite);
                this._dimensions = 2;
            }, () => {}, () => {
                if(filename != DEFAULT_URL) {
                    this._createMesh(DEFAULT_URL);
                } else {
                    console.error("Can't display default avatar :(");
                }
            });
        } else {
            if(filename != DEFAULT_URL) {
                this._createMesh(DEFAULT_URL);
            } else {
                console.error("Default avatar URL is invalid :(");
            }
        }
    }

    _saveOriginalTransparencyStates() {
        this._avatarParent.traverse(function(node) {
            if(node instanceof THREE.Mesh && node.material) {
                if(Array.isArray(node.material)) {
                    for(let i = 0; i < node.material.length; i++) {
                        let material = node.material[i];
                        material.userData['transparent'] = material.transparent;
                        material.userData['opacity'] = material.opacity;
                    }
                } else {
                    let material = node.material;
                    material.userData['transparent'] = material.transparent;
                    material.userData['opacity'] = material.opacity;
                }
            }
        });
    }

    fade(percent) {
        this._isFading = true;
        this._avatarParent.traverse(function(node) {
            if(node instanceof THREE.Mesh && node.material) {
                node.renderOrder = Infinity;
                if(Array.isArray(node.material)) {
                    for(let i = 0; i < node.material.length; i++) {
                        let material = node.material[i];
                        if(!material.transparent) {
                            material.transparent = true;
                            material.needsUpdate = true;
                        }
                        material.opacity = material.userData['opacity']*percent;
                    }
                } else {
                    let material = node.material;
                    if(!material.transparent) {
                        material.transparent = true;
                        material.needsUpdate = true;
                    }
                    material.opacity = material.userData['opacity'] * percent;
                }
            }
        });
    }

    endFade() {
        if(!this._isFading) return;
        this._isFading = false;
        this._avatarParent.traverse(function(node) {
            if(node instanceof THREE.Mesh && node.material) {
                if(Array.isArray(node.material)) {
                    for(let i = 0; i < node.material.length; i++) {
                        let mtrl = node.material[i];
                        if(mtrl.transparent != mtrl.userData['transparent']) {
                            mtrl.transparent = mtrl.userData['transparent'];
                            mtrl.needsUpdate = true;
                        }
                        mtrl.opacity = mtrl.userData['opacity'];
                    }
                } else {
                    let mtrl = node.material;
                    if(mtrl.transparent != mtrl.userData['transparent']) {
                        mtrl.transparent = mtrl.userData['transparent'];
                        mtrl.needsUpdate = true;
                    }
                    mtrl.opacity = mtrl.userData['opacity'];
                }
            }
        });
    }

    lookAtLocal(point) {
        if(this._object.parent) {
            vector3s[0].copy(point);
            this._object.parent.localToWorld(vector3s[0]);
            this._object.lookAt(vector3s[0]);
        }
    }

    updateSourceUrl(url) {
        while(this._avatarParent.children[0]) {
            let child = this._avatarParent.children[0];
            this._avatarParent.remove(child);
            fullDispose(child, true);
        }
        this._avatarUrl = url;
        this._createMesh(url);
    }

    get avatarUrl() { return this._avatarUrl; }
    get isXR() { return this._isXR; }
    get verticalOffset() { return this._verticalOffset; }

    set avatarUrl(avatarUrl) { this.updateSourceUrl(avatarUrl); }
    set isXR(isXR) { this._isXR = isXR; }
    set verticalOffset(verticalOffset) {
        this._verticalOffset = verticalOffset;
        this._object.position.setY(verticalOffset);
    }

    displayAvatar() {
        this._object.add(this._avatarParent);
    }

    hideAvatar() {
        this._object.remove(this._avatarParent);
    }

    isDisplayingAvatar() {
        return this._avatarParent.parent == this._object;
    }

    exportParams() {
        let params = super.exportParams();
        params['avatarUrl'] = this._avatarUrl;
        params['isXR'] = this._isXR;
        params['verticalOffset'] = this._verticalOffset;
        return params;
    }

    static assetId = '8cad6685-035d-416f-b085-7cb05583bb49';
    static assetName = 'Avatar';
}

ProjectHandler.registerAsset(Avatar);
LibraryHandler.loadBuiltIn(Avatar);
