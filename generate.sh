#!/bin/bash

# json --> html
#resume export index.html --theme classy
./node_modules/.bin/resume export index.html --theme classy

# http --> https
sed -i '' -e 's|http://|https://|g' index.html