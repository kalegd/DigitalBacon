# DigitalBacon

Create 3D websites easily that run on AR, VR, Desktop, and Mobile devices with Digital Bacon. No coding required, but supports an API to create plugins for advanced customizations

<p align="center"><img src="/resources/gifs/vr_asset_transform_demo.gif" title="vr asset transform demo" height="200"> &nbsp;&nbsp;&nbsp;<img src="/resources/gifs/water_color_demo.gif" title="vr water color demo" height="200"> &nbsp;&nbsp;&nbsp;<img src="/resources/gifs/ar_wall_occlusion_demo.gif" title="ar wall occlusion demo" height="200"> &nbsp;&nbsp;&nbsp;<img src="/resources/gifs/iphone_demo.gif" title="iphone demo" height="200"></p>

<div align="center">
  
  [![NPM Package](https://img.shields.io/npm/v/digitalbacon)](https://www.npmjs.com/package/digitalbacon) [![Build Size](https://badgen.net/bundlephobia/minzip/digitalbacon)](https://bundlephobia.com/result?p=digitalbacon) [![NPM Downloads](https://img.shields.io/npm/dw/digitalbacon)](https://www.npmtrends.com/digitalbacon) <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
  
</div>

### How to use
Go to the [Digital Bacon Editor](https://digitalbacon.io/app) to create a 3D website and then save your project zip file. You can then host your project using the below html snippet (or just [fork this repo](https://github.com/kalegd/DigitalBaconSampleProject) and replace my-project.zip with your project file)
```html
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "DigitalBacon": "https://cdn.jsdelivr.net/npm/digitalbacon@latest/build/DigitalBacon.min.js",
          "three": "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js"
        }
      }
    </script>
  </head>
  <body>
    <div id="my-container-id"></div>
    <script type="module">
      import { setup } from 'DigitalBacon';

      let params = { projectFilePath: './my-project.zip'};

      setup("my-container-id", params);
    </script>
  </body>
</html>
```

### Adding Multi-User Support

You'll need an authUrl and socketUrl tied to a server to handle all the handshaking and management between users. [My Digital Bacon](https://mydigitalbacon.com) offers a free tier that you can use for this purpose, just create an account and add your website's origin as an external project and you'll get the necessary urls to be plugged into your setup parameters like so
```javascript
let params = {
    projectFilePath: './my-project.zip',
    authUrl: '{AUTH_URL}',
    socketUrl: '{WEBSOCKET_URL}',
};
setup("my-container-id", params);
```

### Local Network Testing

If you want to test your changes with another device on your local network, you can run `npm run start-ssl`. Before doing this you'll need to create both cert.pem and key.pem files. Mac Users can generate these files via `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`

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
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ShaunFrost"><img src="https://avatars.githubusercontent.com/u/7031459?v=4?s=100" width="100px;" alt="Rasesh Kumar Rout"/><br /><sub><b>Rasesh Kumar Rout</b></sub></a><br /><a href="https://github.com/kalegd/DigitalBacon/commits?author=ShaunFrost" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kaigidwani"><img src="https://avatars.githubusercontent.com/u/112210757?v=4?s=100" width="100px;" alt="kaigidwani"/><br /><sub><b>kaigidwani</b></sub></a><br /><a href="https://github.com/kalegd/DigitalBacon/commits?author=kaigidwani" title="Documentation">📖</a></td>
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
