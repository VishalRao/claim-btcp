#!/bin/bash

if [ -z "$1" ]
  then
    echo "No git message supplied"
    exit 1;
fi

GH_PAGES="trezorio-ghpages"
DIST="trezorio-ghpages/claim-btcp"
CLAIM="convert-bcc"

printf "\n-- DEPLOY START -----------------------\n"

# download current verison of gh_pages
# cd ../$GH_PAGES
# git pull
# cd ../$CLAIM

printf "\n-- BUILDING PROJECT -------------------\n"
yarn run build

printf "\n-- COPYING FILES ----------------------\n"

rm -rf ../$DIST
cp -aR build ../$DIST

printf "\n-- ADDING TO GIT ----------------------\n"
cd ../$GH_PAGES
# git add .
# git commit -m $1
# git push
printf "\n-- Git pushed with message '$1'\n"
printf "\n-- COMPLETE ---------------------------\n"
cd ../$CLAIM
