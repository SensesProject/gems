import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const url = 'https://db1.ene.iiasa.ac.at/ixmp-api-sandbox/rest/v2.1'
const authUrl = 'https://db1.ene.iiasa.ac.at/EneAuth/config/v1/anonym/IXSE_TEST_PUBLIC'

export default new Vuex.Store({
  state: {
    gem: null,
    config: null,
    token: null,
    runs: null,
    data: null,
    colors: ['yellow', 'blue', 'purple', 'green', 'red', 'orange'],
    regions: null,
    models: null,
    scenarios: null,
    metadata: null,
    options: null,
    current: null,
    domains: {},
    gems: [],
    modules: [],
    // new
    perspective: {
      question: null,
      comparison: null,
      params: {}
    }
  },
  getters: {
    dict: state => {
      if (state.config == null || state.config.dict == null) return {}
      return state.config.dict
    }
  },
  mutations: {
    set (state, { key, value }) {
      state[key] = value
    }
  },
  actions: {
    update ({ commit, dispatch }, d) {
      commit('set', d)
      if (d.key === 'perspective') dispatch('updateTimeseries')
      // if (d.key === 'options') dispatch('updateTimeseries')
    },
    async fetchGems ({ commit }) {
      commit('set', {
        key: 'gems',
        value: await fetch(`./gems.json`).then(r => r.json())
      })
    },
    async initSession ({ commit, state, dispatch }, gemId) {
      commit('set', { key: 'config', value: null })
      if (state.token == null) {
        commit('set', { key: 'token', value: await fetch(authUrl).then(r => r.json()) })
      }
      if (state.runs == null || state.regions == null || state.models == null || state.scenarios == null) {
        const options = { headers: { Authorization: `Bearer ${state.token}` } }
        commit('set', { key: 'runs', value: await fetch(`${url}/runs`, options).then(r => r.json()) })
        commit('set', { key: 'regions', value: await fetch(`${url}/nodes?hierarchy=*`, options).then(r => r.json()) })
        commit('set', { key: 'models', value: await fetch(`${url}/models`, options).then(r => r.json()) })
        commit('set', { key: 'scenarios', value: await fetch(`${url}/scenarios`, options).then(r => r.json()) })
      }
      dispatch('initGem', gemId)
    },
    async initGem ({ commit }, gemId) {
      commit('set', { key: 'gem', value: null })
      const gem = await fetch(`./configs/${gemId}.json`).then(r => r.json()).catch(e => {
        // console.error('failed to load gem config')
      })
      commit('set', { key: 'gem', value: gem })
      commit('set', {
        key: 'perspective',
        value: {
          question: gem.questions[0].name,
          comparison: gem.params[0].name,
          params: Object.fromEntries(gem.params.map(p => [p.name, p.options[0].name]))
        }
      })
      // if (config == null) return
      // commit('set', { key: 'options', value: (config.dropdowns || []).map(o => o.options[0].label) })
    },
    async updateTimeseries ({ commit, state }) {
      commit('set', { key: 'data', value: null })
      commit('set', { key: 'config', value: getConfig(state) })
      const { data, domains } = await getData(state)
      commit('set', { key: 'data', value: data })
      commit('set', { key: 'domains', value: domains })
      commit('set', { key: 'metadata', value: await getMetadata(state) })
      // if (state === null) {
      //   const { data, current, domains } = await getTimeseries(state)

      //   // commit('set', { key: 'data', value: null })
      //   commit('set', { key: 'current', value: current })
      //   commit('set', { key: 'data', value: data })
      //   commit('set', { key: 'domains', value: domains })
      //   commit('set', { key: 'metadata', value: await getMetadata(state) })
      // }
    }
  }
})

function getConfig ({ gem, perspective }) {
  let config = {
    runs: [
      ['MESSAGE-GLOBIOM 1.0', 'SSP2-Baseline'],
      ['MESSAGE-GLOBIOM 1.0', 'SSP2-19']
    ],
    regions: ['World'],
    variables: ['Emissions|CO2', 'Price|Carbon']
  }
  config = { ...config, ...gem.config }

  const question = gem.questions.find(q => q.name === perspective.question) || {}
  const grouped = {};
  (question.groups || []).forEach(g => {
    Object.keys(g.config).forEach(k => {
      if (grouped[k] === undefined) grouped[k] = []
      grouped[k] = [
        ...grouped[k],
        ...g.config[k]
      ]
    })
  })

  config = { ...config, ...gem.config, ...question.config, ...grouped }

  config.runs = config.runs.map(r => ({ model: r[0], scenario: r[1] }))
  // string interpolation
  gem.params.forEach(p => {
    const options = p.options.filter(o => perspective.comparison === p.name || o.name === perspective.params[p.name])
    const funnel = perspective.comparison === p.name && p.type === 'funnel'
    config.runs = options.map(option => {
      return config.runs.map(r => {
        let { model, scenario } = r
        let type = r.type || (funnel ? perspective.params[p.name] !== option.name ? 'funnel' : 'funnel-select' : null)
        const interpolations = Object.fromEntries(Object.keys(option).filter(k => k !== 'name').map(k => [k, option[k]]))
        Object.keys(interpolations).forEach(k => {
          model = model.replaceAll(k, option[k])
          scenario = scenario.replaceAll(k, option[k])
        })
        return { ...r, model, scenario, type, params: { ...r.params, ...Object.fromEntries([[p.name, option.name]]) } }
      })
    }).flat()
  })
  return config
}

async function getData ({ token, config, runs, colors, gem, perspective }) {
  const filters = {
    regions: config.regions.map(r => r.value || r),
    variables: config.variables.map(r => r.value || r),
    runs: config.runs
      .map(r => runs.find(r2 => r2.model === r.model && r2.scenario === r.scenario))
      .filter(r => r !== undefined)
      .map(r => r.run_id),
    units: [],
    years: [],
    timeslices: []
  }

  const timeseries = await fetch(`${url}/runs/bulk/ts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filters })
  }).then(r => r.json())

  const panels = config.regions.map(region => {
    return config.variables.map(variable => ({
      variable,
      region,
      label: [
        config.regions.length > 1 ? region : false,
        config.variables.length > 1 ? variable : false
      ].filter(l => l).map(l => (l.name || l)).filter(l => l.length > 0).join(' | ')
    }))
  }).flat().map(panel => {
    const runs = config.runs.map((run, i) => {
      const ts = timeseries.filter(
        ts => ts.model === run.model && ts.scenario === run.scenario && ts.variable === (panel.variable.value || panel.variable) && ts.region === (panel.region.value || panel.region)
      )
      if (ts.length === 0) return null
      return {
        ...run,
        color: run.type != null ? colors[0] : colors[i],
        unit: ts[0].unit,
        series: ts.map(t => ({ year: t.year, value: t.value }))
      }
    }).filter(r => r != null)
    return {
      runs,
      label: panel.label
    }
  })

  const units = [...new Set(timeseries.map(ts => ts.unit))]
  const domains = {}
  units.forEach(u => {
    const values = timeseries.filter(ts => ts.unit === u).map(ts => ts.value)
    domains[u] = [Math.max(...values), Math.min(...values, 0)]
  })
  return { data: panels, domains }
}

// async function getTimeseries ({ token, config, runs, options, colors }) {
//   const current = { ...config.default }

//   options.map((o, i) => config.dropdowns[i].options.find(or => or.label === o)).forEach(o => {
//     Object.keys(o).filter(k => k !== 'label').forEach(k => {
//       current[k] = o[k]
//     })
//   });

//   ['variables', 'regions', 'runs', 'funnel', 'reference'].forEach(k => {
//     if (current[k] == null) return
//     current[k] = current[k].map(c => {
//       if (typeof (c) === 'string') return c.replace(/\$\{([^}]+)\}/g, v => current[v.match(/\$\{(.+)\}/)[1]])
//       return c.map(c1 => {
//         return c1.replace(/\$\{([^}]+)\}/g, v1 => current[v1.match(/\$\{(.+)\}/)[1]])
//       })
//     })
//   })

//   current.all = [
//     ...current.runs.map((r, i) => ({ model: r[0], scenario: r[1], type: 'default', color: colors[i] })),
//     ...(current.funnel || []).map(r => ({ model: r[0], scenario: r[1], type: 'funnel' })),
//     ...(current.reference || []).map(r => ({ model: r[0], scenario: r[1], type: 'reference' }))
//   ].map((r, i) => {
//     const run = runs.find(r2 => r2.model === r.model && r2.scenario === r.scenario)
//     if (run == null) return null
//     return {
//       ...r,
//       name: `${r.model} | ${r.scenario}`,
//       runId: run.run_id
//     }
//   }).filter(r => r != null)

//   current.models = [...new Set(current.all.map(r => r.model))]
//   current.scenarios = [...new Set(current.all.map(r => r.scenario))]

//   const filter = {
//     filters: {
//       runs: current.all.map(r => r.runId),
//       regions: current.regions,
//       variables: current.variables,
//       units: [],
//       years: [],
//       timeslices: []
//     }
//   }

//   const timeseries = await fetch(`${url}/runs/bulk/ts`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(filter)
//   }).then(r => r.json())

//   const panels = current.regions.map(region => {
//     return current.variables.map(variable => ({
//       variable,
//       region,
//       label: [
//         current.regions.length > 1 ? region : false,
//         current.variables.length > 1 ? variable : false
//       ].filter(l => l).map(l => (config.dict && config.dict[l]) ? config.dict[l] : l).join(' | ')
//     }))
//   }).flat().map(panel => {
//     const runs = current.all.map((run) => {
//       const ts = timeseries.filter(
//         ts => ts.runId === run.runId && ts.variable === panel.variable && ts.region === panel.region
//       )
//       if (ts.length === 0) return null
//       return {
//         ...run,
//         unit: ts[0].unit,
//         series: ts.map(t => ({ year: t.year, value: t.value }))
//       }
//     }).filter(r => r != null)
//     return {
//       runs,
//       label: panel.label
//     }
//   })

//   const units = [...new Set(timeseries.map(ts => ts.unit))]
//   const domains = {}
//   units.forEach(u => {
//     const values = timeseries.filter(ts => ts.unit === u).map(ts => ts.value)
//     domains[u] = [Math.max(...values), Math.min(...values, 0)]
//   })
//   return { data: panels, current, domains }
// }

async function getMetadata ({ token, regions, scenarios, models, config }) {
  const r = regions ? config.regions
    .map(d => regions.find(c => (d.value || d) === c.name))
    .filter(d => d != null)
    .map(d => ({
      key: `/regions/${d.id}`,
      ...d
    })) : []

  console.log(config)
  const s = scenarios ? config.runs
    .map(d => scenarios.find(c => d.scenario === c.name))
    .filter(d => d != null)
    .map(d => ({
      key: `/scenarios/${d.id}`,
      ...d
    })) : []

  const m = models ? config.runs
    .map(d => models.find(c => d.model === c.name))
    .filter(d => d != null)
    .map(d => ({
      key: `/models/${d.id}`,
      ...d
    })) : []

  const docs = await fetch(`${url}/docs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ keys: [
      ...s.map(d => d.key),
      ...r.map(d => d.key),
      ...m.map(d => d.key)
    ] })
  }).then(r => r.json()).then(docs => docs.map(d => {
    const descr = d.description.match(/<\/h1>\s(.+)/)
    const category = d.key.match(/^\/([^/]+)/)[1]
    return {
      category,
      description: descr ? descr[1] : null,
      name: [...s, ...r, ...m].find(({ key }) => key === d.key).name
    }
  }))

  return [{
    name: 'Model',
    items: docs.filter(m => m.category === 'models')
  }, {
    name: 'Scenario',
    items: docs.filter(m => m.category === 'scenarios')
  }, {
    name: 'Region',
    items: docs.filter(m => m.category === 'regions')
  }]
}
