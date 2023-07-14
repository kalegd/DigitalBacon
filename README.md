# DigitalBacon
Content Management System for 3D Websites

#### How to use
The following code snippet assumes dependencies have been downloaded using npm. three, three-mesh-ui, and three-mesh-bvh are all required dependencies
```html
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "DigitalBacon": "https://cdn.jsdelivr.net/npm/digitalbacon@0.1.3/build/DigitalBacon.min.js",
          "three": "https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js",
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
