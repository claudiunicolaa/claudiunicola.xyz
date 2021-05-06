[![Netlify Status](https://api.netlify.com/api/v1/badges/b77be5a1-d3d5-4cc9-b65d-7535c4a7bd80/deploy-status)](https://app.netlify.com/sites/affectionate-knuth-e1e325/deploys)

# claudiunicola.xyz

Personal website created using https://jsonresume.org/. It uses `Classy`theme.

### Prerequisites
```
node
npm
```

### Steps:
- install resume-cli tool (https://jsonresume.org/getting-started/)
- install the theme `npm install jsonresume-theme-classy`
- create JSON schema (http://registry.jsonresume.org/) and saved it locally as `resume.json`
- run `resume export index.html --theme classy`


### Deploy
Run `bash generate.sh`

### Export as PDF

Run `bash export_to_pdf.sh`
