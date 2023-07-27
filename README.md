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

```
# Measurement from an external time source not actively synchronized with the system clock.

Header header    # stamp is system time for which measurement was valid
                 # frame_id is not used 

time   time_ref  # corresponding time from this external source
string source    # (optional) name of time source

================================================================================
MSG: std_msgs/Header
# Standard metadata for higher-level stamped data types.
# This is generally used to communicate timestamped data 
# in a particular coordinate frame.
# 
# sequence ID: consecutively increasing ID 
uint32 seq
#Two-integer timestamp that is expressed as:
# * stamp.sec: seconds (stamp_secs) since epoch (in Python the variable is called 'secs')
# * stamp.nsec: nanoseconds since stamp_secs (in Python the variable is called 'nsecs')
# time-handling sugar is provided by the client library
time stamp
#Frame this data is associated with
string frame_id

```


