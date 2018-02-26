DIST="build"
CONNECT="../connect"


printf "\n-- DEPLOY START -----------------------\n"

yarn run build

printf "\n-- COPYING Connect FILES ----------------------\n"

cp -aR $CONNECT/connect.js $DIST
mkdir $DIST/popup

cp -aR $CONNECT/popup/popup.html $DIST/popup/popup.html
cp -aR $CONNECT/popup/css $DIST/popup/css
cp -aR $CONNECT/popup/js $DIST/popup/js
cp -aR $CONNECT/popup/img $DIST/popup/img
cp -aR $CONNECT/popup/config_signed.bin $DIST/popup/config_signed.bin


printf "\n-- COMPLETE ---------------------------\n"
