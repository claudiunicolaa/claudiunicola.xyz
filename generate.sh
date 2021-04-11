#!/bin/bash

# json --> html
resume export index.html --theme classy

# http --> https
sed -i '' -e 's|http://|https://|g' index.html

# push
git add .
git commit -m 'update content'
git push origin master
