#!/bin/sh
cd $(pwd)
./node_modules/.bin/mocha --watch-files "**/*.ts" --watch "test/test-$1.ts"
