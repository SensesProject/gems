# GEMs

GEMs are guided explore modules and are mostly used as supplementary material for SENSES Learn-Modules. A GEM (e.g. *Where do we want to go? How do emissions decline?*) is generally structured around a couple of guiding questions and belongs to a group of GEMs (e.g. *Emissions gap*).

Each GEM has a config file, which is parsed and used to fetch and visualize the required data as well as to offer user options. There's also a main config '/public/gems.json' listing the available GEMs and group of GEMs. To add a new GEM a config must be provided and it must be added to said main config.

## Main Config

`/public/gems.json`

An array containing an object for each Group of GEMs with properties `title [String]`, `dir [String, the directory for GEM config files]`, `id [String, optional, id of the related learn module]`, `gems [Array]`. The gems-array consists of objects with the properties `id [String, config filename without file-ending, also used in url]` and `title [String]`.

e.g.

```
[{
  "title": "Transition risk",
  "dir": "transition-risk",
  "id": "transition-risk",
  "gems": [
    {"id": "model-assumptions_CD-LINKS", "title": "Basic assumptions in the CD-LINKS study"},
    …
  ]
}, …]
```

### GEM Configs

`/public/configs/[Group of GEMs directory]/[GEM id].json`


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
