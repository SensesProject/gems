# gems

## Adding GEMS

GEMs are generated based on config files placed in `/public/configs/`. Adding a GEM to `/public/configlist.csv` lists it on the index page.

To create a GEM it is recommended to copy one of the examples available in `/public/configs/` and modify it accordingly.

Configs are stored as JSON files and need to follow a given structure:

```
{
  "title": "…",
  "description": "…",
  "default": {…},
  "dropdowns": […],
  "primaryDimension": "…",
  "dict": {…}
}
```

Those fields are described in greater Detail below.

### title:String (optional)
Title of the GEM. Will be displayed on top of the GEM.

### description:String (optional)
Description of the GEM. Will be displayed below the title.

### default:Object (required)
An object containing the default parameters for the four dimensions `models`, `scenarios`, `variables` and `regions`. Dimensions set via options may be dropped here.

This could look something like this:

```
"default": {
    "variables": [
      "Emissions|CO2|AFOLU",
      "Emissions|CH4|AFOLU",
      "Emissions|N2O|AFOLU"
    ],
    "models": ["REMIND-MAgPIE 1.7-3.0"],
    "scenarios": [
      "PEP_1p5C_full_NDC",
      "PEP_1p5C_full_netzero",
      "PEP_1p5C_full_eff"
    ],
    "regions": ["World"]
  },
```

Note that all dimensions are set with arrays of strings.

### dropdowns:Array (optional)
Dropdowns allow to override default parameters for the four dimensions set in `default` (see above).

`dropdowns` is an array of Objects each of which configures a single dropdown and has to fields:

#### label:String (optional)
A label that is displayed above the dropdown

#### options:Array (required)
An array containing the actual options (objects) users may choose. Each of them contain a `label` (String, required) which is displayed in the dropdown. Other fields are used to overwrite what has been set as `default` (see above).

This could look something like this:

```
"options": [{
  "label": "AFOLU Emissions",
  "variables": [
    "Emissions|CO2|AFOLU",
    "Emissions|CH4|AFOLU",
    "Emissions|N2O|AFOLU"
  ]
}
```

### primaryDimension:String (required)
This defines which dimension (`models`, `scenarios`, `variables` or `regions`) is shown within a panel. All other dimensions are spread into new panels.

### dict:Object (optional)
To make things more readable model-, scenario-, variable- and region names can be replaced with other text.

This could look something loke this

```
"dict": {
  "Emissions|CO2|AFOLU": "CO₂",
  "Emissions|CH4|AFOLU": "CH₄",
  "Emissions|N2O|AFOLU": "N₂O",
  "PEP_1p5C_full_NDC": "PEP 1.5°C full NDC",
  "PEP_1p5C_full_netzero": "PEP 1.5°C full netzero",
  "PEP_1p5C_full_eff": "PEP 1.5°C full eff"
}
```

### String Interpolation
String Interpolation can be used to paste model-, scenario-, variable- and region names together based on multiple dropdowns.

In the following example parts of the string in `default/scenarios` are replaced by two dropdowns

```
"default": {
  "models": ["REMIND-MAgPIE 1.7-3.0"],
  "scenarios": [
    "PEP_${warming}_${cdr}_NDC",
    "PEP_${warming}_${cdr}_netzero",
    "PEP_${warming}_${cdr}_eff"
  ],
  "regions": ["World"]
},
"dropdowns": [{
  "label": "Warming Level",
  "options": [{
    "label": "2°C",
    "warming": "1p5C"
  }, {
    "label": "1.5°C",
    "warming": "2C"
  }]
}, {
  "label": "CDR",
  "options": [{
    "label": "Full",
    "cdr": "full"
  }, {
    "label": "Reduced",
    "cdr": "red"
  }]
}]
```

Instead of overriding whole dimensions both dropdowns define new local variables `warming` (`"warming": "1p5C"` or "warming": "2C") and `cdr` (`"cdr": "full"` or `"cdr": "red"`). Model-, scenario-, variable- and region names can access those variables by using template syntax: `${[Variable]}`.

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
