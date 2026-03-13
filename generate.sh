#!/bin/bash

# json --> html
resume export index.html --theme classy

# http --> https
sed -i '' -e 's|http://|https://|g' index.html

# add Resume PDF download link after the last profile entry (Twitter)
sed -i '' -e 's|clanic_x" target= "_blank" class= "profile">Twitter</a></p>|clanic_x" target= "_blank" class= "profile">Twitter</a></p>\n\t\t\t<p class= "profile"><a href= "/Claudiu_Nicola_Resume.pdf" download class= "profile">Resume PDF</a></p>|' index.html

# blog: markdown --> html (posts/, RSS feed, sitemap)
echo "Building blog..."
node build-blog.js
echo "Blog build complete."

# push
git add .
git commit -m 'update content'
git push origin master
