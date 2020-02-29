import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const url = 'https://db1.ene.iiasa.ac.at/ixmp-api-sandbox/rest/v2.1'
const authUrl = 'https://db1.ene.iiasa.ac.at/EneAuth/config/v1/anonym/IXSE_TEST_PUBLIC'

export default new Vuex.Store({
  state: {
    config: null,
    token: null,
    runs: null,
    data: null,
    colors: ['blue', 'green', 'yellow', 'orange', 'red', 'purple'],
    regions: null,
    models: null,
    scenarios: null,
    metadata: null,
    options: null,
    current: null,
    domains: {},
    gems: [],
    modules: []
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
      if (d.key === 'options') dispatch('updateTimeseries')
    },
    async fetchGems ({ commit }) {
      const modules = await fetch(`https://dev.climatescenarios.org/settings/modules.json`).then(r => r.json()).then(m => m.modules)
      commit('set', {
        key: 'gems',
        value: await fetch(`./gems.json`).then(r => r.json()).then(gems => {
          return gems.map(gem => {
            const module = modules.find(m => m.id === gem.id)
            if (module == null) return gem
            return {
              ...gem,
              title: module.title,
              link: module.link
            }
          })
        })
      })
    },
    async initSession ({ commit, state, dispatch }, gem) {
      commit('set', { key: 'config', value: null })
      // commit('set', { key: 'gems', value: await fetch(`./gems.json`).then(r => r.json()) })
      commit('set', { key: 'token', value: await fetch(authUrl).then(r => r.json()) })
      if (state.token == null) {
        commit('set', { key: 'token', value: await fetch(authUrl).then(r => r.json()) })
      }
      if (state.runs == null || state.regions == null || state.models == null || state.scenarios == null) {
        const options = { headers: { Authorization: `Bearer ${state.token}` } }
        commit('set', { key: 'runs', value: await fetch(`${url}/runs`, options).then(r => r.json()).then(j => j.map(r => ({ ...r, run: r.run_id }))) })
        commit('set', { key: 'regions', value: await fetch(`${url}/nodes?hierarchy=*`, options).then(r => r.json()) })
        commit('set', { key: 'models', value: await fetch(`${url}/models`, options).then(r => r.json()) })
        commit('set', { key: 'scenarios', value: await fetch(`${url}/scenarios`, options).then(r => r.json()) })
      }
      dispatch('initGem', gem)
    },
    async initGem ({ commit, dispatch, state }, gem) {
      commit('set', { key: 'config', value: null })
      const config = await fetch(`./configs/${gem}.json`).then(r => r.json())
      if (config == null) return
      commit('set', { key: 'config', value: config })
      commit('set', { key: 'options', value: (config.dropdowns || []).map(o => o.options[0].label) })
    },
    async updateTimeseries ({ commit, state }) {
      commit('set', { key: 'data', value: null })
      const { data, current, domains } = await getTimeseries(state)
      commit('set', { key: 'current', value: current })
      commit('set', { key: 'data', value: data })
      commit('set', { key: 'domains', value: domains })
      commit('set', { key: 'metadata', value: await getMetadata(state) })
    }
  }
})

async function getTimeseries ({ token, config, runs, options, colors }) {
  const current = { ...config.default }

  options.map((o, i) => config.dropdowns[i].options.find(or => or.label === o)).forEach(o => {
    Object.keys(o).filter(k => k !== 'label').forEach(k => {
      current[k] = o[k]
    })
  });

  ['variables', 'regions', 'runs', 'funnel', 'reference'].forEach(k => {
    if (current[k] == null) return
    current[k] = current[k].map(c => {
      if (typeof (c) === 'string') return c.replace(/\$\{([^}]+)\}/g, v => current[v.match(/\$\{(.+)\}/)[1]])
      return c.map(c1 => {
        return c1.replace(/\$\{([^}]+)\}/g, v1 => current[v1.match(/\$\{(.+)\}/)[1]])
      })
    })
  })

  current.all = [
    ...current.runs.map((r, i) => ({ model: r[0], scenario: r[1], type: 'default', color: colors[i] })),
    ...(current.funnel || []).map(r => ({ model: r[0], scenario: r[1], type: 'funnel' })),
    ...(current.reference || []).map(r => ({ model: r[0], scenario: r[1], type: 'reference' }))
  ].map((r, i) => {
    const run = runs.find(r2 => r2.model === r.model && r2.scenario === r.scenario)
    if (run == null) return null
    return {
      ...r,
      name: `${r.model} | ${r.scenario}`,
      runId: run.run_id
    }
  }).filter(r => r != null)

  current.models = [...new Set(current.all.map(r => r.model))]
  current.scenarios = [...new Set(current.all.map(r => r.scenario))]

  const filter = {
    filters: {
      runs: current.all.map(r => r.runId),
      regions: current.regions,
      variables: current.variables,
      units: [],
      years: [],
      times: []
    }
  }

  const timeseries = await fetch(`${url}/runs/bulk/ts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(filter)
  }).then(r => r.json())

  const panels = current.regions.map(region => {
    return current.variables.map(variable => ({
      variable,
      region,
      label: [current.regions.length > 1 ? region : false, current.variables.length > 1 ? variable : false].filter(l => l).join(' | ')
    }))
  }).flat().map(panel => {
    const runs = current.all.map(run => {
      const ts = timeseries.filter(
        ts => ts.runId === run.runId && ts.variable === panel.variable && ts.region === panel.region
      )
      if (ts.length === 0) return null
      return {
        ...run,
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
  return { data: panels, current, domains }
}

async function getMetadata ({ token, regions, scenarios, models, current }) {
  const r = regions ? current.regions
    .map(d => regions.find(c => d === c.name))
    .filter(d => d != null)
    .map(d => ({
      key: `/regions/${d.id}`,
      ...d
    })) : []

  const s = scenarios ? current.scenarios
    .map(d => scenarios.find(c => d === c.name))
    .filter(d => d != null)
    .map(d => ({
      key: `/scenarios/${d.id}`,
      ...d
    })) : []

  const m = models ? current.models
    .map(d => models.find(c => d === c.name))
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
