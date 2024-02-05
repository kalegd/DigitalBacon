# DigitalBacon

Create 3D websites easily that run on AR, VR, Desktop, and Mobile devices with Digital Bacon. No coding required, but supports an API to create plugins for advanced customizations

<p align="center"><img src="/resources/gifs/vr_asset_transform_demo.gif" title="vr asset transform demo" height="200"> &nbsp;&nbsp;&nbsp;<img src="/resources/gifs/water_color_demo.gif" title="vr water color demo" height="200"> &nbsp;&nbsp;&nbsp;<img src="/resources/gifs/ar_wall_occlusion_demo.gif" title="ar wall occlusion demo" height="200"> &nbsp;&nbsp;&nbsp;<img src="/resources/gifs/iphone_demo.gif" title="iphone demo" height="200"></p>

<div align="center">
  
  [![NPM Package](https://img.shields.io/npm/v/digitalbacon)](https://www.npmjs.com/package/digitalbacon) [![Build Size](https://badgen.net/bundlephobia/minzip/digitalbacon)](https://bundlephobia.com/result?p=digitalbacon) [![NPM Downloads](https://img.shields.io/npm/dw/digitalbacon)](https://www.npmtrends.com/digitalbacon) <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
  
</div>

#### How to use
Go to [Digital Bacon](https://digitalbacon.io) to create you own 3D website and then save your project zip file. You can then use host your project using the below html snippet
```html
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "DigitalBacon": "https://cdn.jsdelivr.net/npm/digitalbacon@latest/build/DigitalBacon.min.js",
          "three": "https://cdn.jsdelivr.net/npm/three@0.156.1/build/three.module.js",
          "three-mesh-ui": "https://cdn.jsdelivr.net/npm/three-mesh-ui@6.5.4/build/three-mesh-ui.module.js",
          "three-mesh-bvh": "https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.6.1/src/index.min.js"
        }
      }
    </script>
    <script src="https://code.jquery.com/jquery-3.6.0.slim.min.js" integrity="sha256-u7e5khyithlIdTpu22PHhENmPcRdFiHRjhAuHcs05RI=" crossorigin="anonymous" defer></script>
    <script src="https://apis.google.com/js/api.js" defer></script>
    <script src="https://accounts.google.com/gsi/client" defer></script>
  </head>
  <body>
    <div id="container"></div>
    <script type="module">
      import { setup } from 'DigitalBacon';

      let params = { projectFilePath: './my-project.zip'};

      setup("container", params);
    </script>
  </body>
</html>
```

The following Shims may be useful for running in Firefox and Safari as they tend to be a bit behind. You would typically place them in the `<head>` element
```html
    <!-- SHIM FOR IMPORT MAP IN SAFARI -->
    <script async src="https://unpkg.com/es-module-shims@1.5.4/dist/es-module-shims.js"></script>
    <!-- SHIM FOR WEBRTC IN FIREFOX -->
    <script async src="https://cdnjs.cloudflare.com/ajax/libs/webrtc-adapter/8.2.0/adapter.min.js"></script>
```

## Contributors

A special thanks to the following people for taking time to contribute to this project
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/prajwalbandak"><img src="https://avatars.githubusercontent.com/u/62823252?v=4?s=100" width="100px;" alt="prajwalbandak"/><br /><sub><b>prajwalbandak</b></sub></a><br /><a href="#infra-prajwalbandak" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/laurittab"><img src="https://avatars.githubusercontent.com/u/57863817?v=4?s=100" width="100px;" alt="Lauritta"/><br /><sub><b>Lauritta</b></sub></a><br /><a href="#infra-laurittab" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/justjo3l"><img src="https://avatars.githubusercontent.com/u/63659576?v=4?s=100" width="100px;" alt="Joel Jose"/><br /><sub><b>Joel Jose</b></sub></a><br /><a href="https://github.com/kalegd/DigitalBacon/commits?author=justjo3l" title="Tests">⚠️</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
