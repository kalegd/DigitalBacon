/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InternalAssetEntity from '/scripts/core/assets/InternalAssetEntity.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { vector3s } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

const DEFAULT_URL = 'https://d1a370nemizbjq.cloudfront.net/6a141c79-d6e5-4b0d-aa0d-524a8b9b54a4.glb';
  
export default class Avatar extends InternalAssetEntity {
    constructor(params = {}) {
        params['assetId'] = Avatar.assetId;
        super(params);
        if(params == null) {
            params = {};
        }
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
                    gltf.scene.traverse((child) => {
                        if(child.name.toLowerCase().includes("hand")) {
                            hands.add(child);
                        }
                    });
                    hands.forEach((hand) => { hand.parent.remove(hand); });
                    gltf.scene.position.setY(-0.65);
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

    getAvatarUrl() {
        return this._avatarUrl;
    }

    getVerticalOffset() {
        return this._verticalOffset;
    }

    setAvatarUrl(avatarUrl) {
        this.updateSourceUrl(avatarUrl);
    }

    setVerticalOffset(verticalOffset) {
        this._verticalOffsert = verticalOffset;
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
        params['verticalOffset'] = this._verticalOffset;
        return params;
    }

    static assetId = '8cad6685-035d-416f-b085-7cb05583bb49';
    static assetName = 'Avatar';
}

ProjectHandler.registerAsset(Avatar);
LibraryHandler.loadBuiltIn(Avatar);
