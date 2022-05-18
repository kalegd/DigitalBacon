import fs from 'fs';
import mime from 'mime';
import replace from '@rollup/plugin-replace';
import rootImport from 'rollup-plugin-root-import';
import { terser } from 'rollup-plugin-terser';

function base64Encode(file) {
    let base64Encoded = fs.readFileSync(file, 'base64');
    let mimeType = mime.getType(file);
    return "data:" + mimeType + ";base64," + base64Encoded;
}

let replacementMap = {};
let icons = ['audio', 'checkmark', 'hamburger', 'image', 'lightbulb', 'material', 'object', 'pencil', 'search', 'shapes', 'texture', 'trash', 'undo', 'redo', 'video'];
let filesToReplace = [
    'images/black_pixel.png',
    'images/white_pixel.png',
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

export default {
    input: 'scripts/core/DigitalBacon.js',
    output: [{
            file: 'build/DigitalBacon.js',
            format: 'es',
        }, {
            file: 'build/DigitalBacon.min.js',
            format: 'es',
            name: 'version',
            plugins: [terser()],
        },
    ],
    external: [
        'three',
        'three-mesh-ui',
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
