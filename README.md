# Elden Bong

## Development

From scratch (Friday November 04 2022)...

```
yarn create electron-app elden-bong --template=webpack
```

* added three and camera-controls
* added eslint (as recommended by eslint-config-standard)
* `yarn add -D eslint-config-standard eslint-plugin-promise eslint-plugin-import eslint-plugin-n`

* upgraded electron-forge and electron, started using preload, context isolation, sandboxing, etc. properly.


### TODO
* add basic scene and sky box
* basic character and animations
* load and change scenes


controller manager
game manager
* start a new game, load, save, quit, etc.

character
* load a model - have some to choose from
  * mage, dork, warrior
  * stats manager
  * weapons/items to hold

maps
* load a map
* import a map
* if no loaded map be in character editor fake location - room that is a wardrobe when you get outside it!
* full 2D map mode with overlay canvas

I'm currently wrestling with Content Protection Policy (CSP)
* I need to properly understand it in the electron environment
* I want to configure that I trust the local file protocol
* https://www.electronjs.org/docs/latest/api/protocol
* the "atom:" protocol style thing is what I've gone with and called the protocol "mine:"

OKAY! got that working!

* the map tiles are from big images from the Ultimate Elden Ring Map Resource Pack
* https://www.nexusmods.com/eldenring/mods/960/
* sliced with image magick https://imagemagick.org/Usage/crop/#crop_tile

```
@ECHO OFF
SET PATH=C:\Program Files\ImageMagick-7.1.1-Q16-HDRI;%PATH%

REM ~ magick identify *.png

REM ~ m0-overworld.png PNG 9728x9216 9728x9216+0+0 8-bit sRGB 172.44MiB 0.000u 0:00.000
REM ~ m1-underground.png PNG 9728x9216 9728x9216+0+0 8-bit sRGB 32.4026MiB 0.000u 0:00.000

REM 256 pixel tiles
REM https://imagemagick.org/Usage/crop/
magick m0-overworld.png -crop 256x256 map-0-overworld-tile256-%%04d.png
magick m1-underground.png -crop 256x256 map-1-underground-tile256-%%04d.png
REM ~ 9728 / 256 = 38
REM ~ 9216 / 256 = 36
REM so we have 38 tiles wide and 36 tiles high
DIR
```

There are two maps named "overworld" and "underground"
* only load from safe dirs as dictated by main thread in config
* user chooses the dir and it is saved in settings
* settings are loaded at startup
* TODO: back and sides of map tiles need to be another texture or could use a plane
* https://stackoverflow.com/questions/35877484/three-js-using-cubetextureloader-to-create-a-different-image-on-each-face-of-a

placing items on the map!
getting all the resources!
icons and info
map overlays and strategy planning stuff - routes, times, stopwatch, etc.

* downloading the resource pack
* unpacking the resource pack
* resource pack dir

my own map definition files

save map to a GLTF or similar

great game assets that are CC0 for including https://polyhaven.com/

map-based controls could do with switching when in map mode
camera controls



* scene controls - ambient light, fog for testing
* YOU DIED overlay transparent div - https://rezuaq.be/new-area/image-creator/
* gradients - https://cssgradient.io/
* look at toon materials
* https://threejs.org/docs/index.html?q=mater#api/en/materials/MeshToonMaterial
* https://threejs.org/examples/#webgl_materials_toon
# SPEC
## controllers
When a controller is plugged in (and a button pressed - as per Web API for controllers)...
- the controller is added to the list of controllers and configured if a config has been saved for it
- many controllers required including duplicates of the same model
- find some unique identifier for a controller
- save the settings for a controller
- controller button and axis mappings format in JSON (and therefore YAML) with a schema


## Maps - a nice 2D map
* import images into map project
* scale and place images
* tile? auto-tile
* coordinate system
* import items with tags, add remove tags, etc.
* local storage for project
* draw routes, leave notes, etc.
* levels of detail? scaling? tiling? 3D? maybe!

imports and downloads from various online resources


resources for item id decoding

https://github.com/Deskete/EldenRingResources/blob/main/ITEM%20IDS%20Elden%20Ring.txt
https://docs.google.com/spreadsheets/d/1evpDLAfi1b3cYfGilDtMWXDvynwyN_lbX1chnSSR7Uk/edit#gid=1201397359
https://github.com/MaxTheMiracle/Dark-Souls-3-Parts-Files/blob/master/Elden%20Ring

db creator methods


https://github.com/The-Grand-Archives/Elden-Ring-CT-TGA

Elden Ring - Master Spreadsheet
https://docs.google.com/spreadsheets/d/1c7rIV3bBKDxP9ngixgigd7ZmczH3DYhDmMt8HY4ijV0/edit#gid=242218508

Looks useful - maybe some standard here?
Want IDs to be a close to the game dev as possible

Hexinton
https://discord.com/channels/934340237914689536/947960108820860948
https://docs.google.com/spreadsheets/u/3/d/e/2PACX-1vQ0LUsF2rBNa55jMq8KNVYFeyxnV_TinvJ9-xh6nzeWhp3OOnPYu_yNCslI2yorP7hFl47Bel4YE82G/pubhtml#

importing methods describe in docs
resource files and directories
drag in a file or dir and add to a feature


## Map Items
For my maps I'd like the data that the wiki has. I've scraped some data from
Chrome dev tools and it has positions in some coordinate system.
I assume these coordinates are linear and should map to my map images with a simple transform of scale and offset.
I can define the transform from wiki map coord to pixel coord by positioning some sites of grace.

load the items list scrape into an array of strings


<img src="/file/Elden-Ring/map-50be4728-3907-4f33-8857-7f063e0d24eb/maps-icons/grace.png" class="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive" title="Stormhill Shack" alt="527-Stormhill Shack" tabindex="0" style="margin-left: 0px; margin-top: 0px; width: 40px; height: 40px; transform: translate3d(768px, 1319px, 0px); z-index: 1319;">



