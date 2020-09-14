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

A GEM config is a JSON file containing all necessary information to render a GEM and can look something like this:

```
{
  "title": "Where do we want to go? How do emissions decline?",
  "description": "Required investments to…",
  "workspace": "https://…",
  "config": {
    "runs": [
      ["REMIND-MAgPIE 1.7-3.0", "PEP_$warming_full_NDC"]
    ],
    "regions": ["World"]
  },
  "questions": [{
    "name": "How much do individual sectors contribute to the decline?",
    "config": {
      "variables": [
        "Emissions|CO2|Energy|Supply|Electricity",
        "Emissions|CO2|Energy|Supply|Liquids",
        …
      ]
    }
  }, …],
  "params": [{
    "name": "Warming Level",
    "options": [{
      "name": "1.5°C",
      "$warming": "1p5C"
    },{
      "name": "2°C",
      "$warming": "2C"
    }]
  }, …]
}
```

The fields `title [String]`, `description [String, optional]`, and `workspace [String, optional]` provide some general information. `description` supports Markdown to allow for some formatting. `workspace` expects a url to an IIASA Scenario Explorer Workspace which offers more options for advanced users *(this field might become obsolete once it's possible to generate workspaces on the fly)*.

`config` defines which data is fetched and shown. It requires the fields `runs`, `variables`, and `regions`, but since `questions` are used to overwrite parts of said config, not all fields must be given at the root level. `runs` is an array of arrays, which contain a model as their first element and a scenario as the second element. Models and scenarios are typically written as templates which are later modified by `params` (see `$warming` in the example above). `regions` and `variables` are arrays of strings, providing the regions and variables to be shown.

`questions` is an array of objects, each representing a guiding question offering a different config. Users can choose between those questions. A question requires a `name` and to override the config their own config. Fields in there are propagated to the main config.

To offer a way to visually structure information, `questions` may als have a field `groups` each having a field `name` and `config`. Configs in groups are chained and don't override each other. A question with groups looks like this:
```
…,
"questions": [{
  "name": "How much do individual sectors contribute to the decline?",
  "groups": [{
    "name": "Energy Supply",
    "config": {
      "variables": [
        "Emissions|CO2|Energy|Supply|Electricity",
        "Emissions|CO2|Energy|Supply|Liquids",
        "Emissions|CO2|Energy|Supply|Gases",
        "Emissions|CO2|Energy|Supply|Heat",
        "Emissions|CO2|Energy|Supply|Solids"
      ]
    }
  }, {
    "name": "Demand & industrial process",
    "config": {
      "variables": [
        "Emissions|CO2|Energy|Demand|Industry",
        "Emissions|CO2|Energy|Demand|Transportation",
        "Emissions|CO2|Energy|Demand|Residential and Commercial",
        "Emissions|CO2|Industrial Processes"
      ]
    }
  }, {
    "name": "Agriculture, forestry & other land use",
    "config": {
      "variables": [
        "Emissions|CO2|AFOLU",
        "Emissions|CH4|AFOLU",
        "Emissions|N2O|AFOLU"
      ]
    }
  }]
}, …],
…
```

`params` are used to manipulate `runs` (models and scenario combinations). They allow users to choose what they want to compare within a chart (e.g. selecting between *warming level*, *policy*, and *cdr availabilty*). The selected dimension is then also used as the legend.

```
…,
"params": [{
  "name": "Warming Level",
  "options": [{
    "name": "1.5°C",
    "$warming": "1p5C"
  },{
    "name": "2°C",
    "$warming": "2C"
  }]
}, …]
```

`params` require a `name` and an array of `options`. Each option is an Object with a name (which is shown to the users), and one or multiple string replacements. In this example the scenario template `PEP_$warming_full_NDC` is interpolated to `PEP_1p5C_full_NDC` or `PEP_2C_full_NDC` depending on the user setting, or if it's the parameter that is compared in the chart, both scenarios will be shown and the legend lists `1.5°C` and `2°C` as the scenarios listed.

A couple of attributes change the appearance of options and scenario/model runs, all of them are not required and default to `false`. `radio` shows the options side by side instead of the dropdown menu. `funnel` draws a polygon underneath the model runs to highlight the range of all runs. `monochrome` displays all options and runs in yellow instead of individual colors. `singleSelect` prevents the user from selecting/inspecting multiple runs at once. Below is an example that employs all these options:

```
…,
"params": [{
  "name": "Warming Level",
  "radio": true,
  "funnel": true,
  "monochrome": true,
  "singleSelect": true,
  "options": [{
    "name": "1.5°C",
    "$warming": "1p5C"
  },{
    "name": "2°C",
    "$warming": "2C"
  }]
}, …]
```


## Development
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
