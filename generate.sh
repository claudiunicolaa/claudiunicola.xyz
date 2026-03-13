#!/bin/bash

# json --> html
resume export index.html --theme classy

# http --> https
sed -i '' -e 's|http://|https://|g' index.html

# blog: markdown --> html (posts/, RSS feed, sitemap)
echo "Building blog..."
node build-blog.js
echo "Blog build complete."

# push
git add .
git commit -m 'update content'
git push origin master
