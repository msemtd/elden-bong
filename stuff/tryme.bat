@ECHO OFF
SET PATH=C:\Program Files\ImageMagick-7.1.1-Q16-HDRI;%PATH%
REM ~ SET F=checkerboard.png
REM ~ DEL /Q %F%
REM ~ magick -size 640x640 pattern:checkerboard %F%
magick -background lightblue -fill blue -size 640x640 caption:'PX' box_PX.png
magick -background lightblue -fill blue -size 640x640 caption:'NX' box_NX.png
magick -background lightblue -fill blue -size 640x640 caption:'PY' box_PY.png
magick -background lightblue -fill blue -size 640x640 caption:'NY' box_NY.png
magick -background lightblue -fill blue -size 640x640 caption:'PZ' box_PZ.png
magick -background lightblue -fill blue -size 640x640 caption:'PY' box_PY.png
REM ~ start %F%