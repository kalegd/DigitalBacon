import fs from 'fs';
import mime from 'mime';
import replace from '@rollup/plugin-replace';
import rootImport from 'rollup-plugin-root-import';
import terser from '@rollup/plugin-terser';

function base64Encode(file) {
    let base64Encoded = fs.readFileSync(file, 'base64');
    let mimeType = mime.getType(file);
    return "data:" + mimeType + ";base64," + base64Encoded;
}

let replacementMap = {};
let icons = ['audio', 'checkmark', 'component', 'ellipsis', 'hamburger', 'headphones', 'home', 'image', 'lightbulb', 'material', 'microphone', 'object', 'pencil', 'search', 'shapes', 'system', 'texture', 'trash', 'undo', 'redo', 'video'];
let filesToReplace = [
    'images/black_pixel.png',
    'images/digital_bacon_pig_compressed.png',
    'images/icons/backspace_icon_white.png',
    'images/icons/shift_icon_white.png',
    'images/icons/enter_icon_white.png',
];
for(let icon of icons) {
    filesToReplace.push('images/icons/' + icon + '_icon_white.png');
}
for(let file of filesToReplace) {
    replacementMap[file] = base64Encode(file);
}

function header() {
    return {
        renderChunk(code) {
            return `/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
${ code }`;
        }
    };
}

export default {
    input: 'scripts/core/DigitalBacon.js',
    output: [{
            file: 'build/DigitalBacon.js',
            format: 'es',
        }, {
            file: 'build/DigitalBacon.min.js',
            format: 'es',
            name: 'version',
            plugins: [
                terser({
                    compress: {
                        keep_classnames: true,
                        keep_fnames: true,
                        keep_infinity: true,
                        module: true,
                    },
                    mangle: { keep_classnames: true, keep_fnames: true },
                }),
                header()
            ],
        },
    ],
    external: [
        'three',
    ],
    plugins: [
        rootImport({
            // Will first look in `client/src/*` and then `common/src/*`.
            root: `${__dirname}`,
            useInput: 'prepend',

            // If we don't find the file verbatim, try adding these extensions
            extensions: '.js',
        }),
        replace({
            values: replacementMap,
        }),
    ],
};
