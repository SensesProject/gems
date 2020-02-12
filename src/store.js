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
    gems: []
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
      commit('set', { key: 'gems', value: await fetch(`./configlist.csv`).then(r => r.text()).then(text => text.split('\n')) })
    },
    async initSession ({ commit, state, dispatch }, gem) {
      commit('set', { key: 'config', value: null })
      commit('set', { key: 'gems', value: await fetch(`./configlist.csv`).then(r => r.text()).then(text => text.split('\n')) })
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
      const config = await fetch(`./configs/${gem}.json`).then(r => r.json()).catch(e => console.error(`requested config ${location.href.split('#')[0]}configs/${gem}.json not found or invalid:\n${e}`))
      if (config == null) return
      commit('set', { key: 'config', value: config })
      commit('set', { key: 'options', value: (config.dropdowns || []).map(o => o.options[0].label) })
    },
    async updateTimeseries ({ commit, state }) {
      commit('set', { key: 'data', value: null })
      const { data, current } = await getTimeseries(state)
      commit('set', { key: 'current', value: current })
      commit('set', { key: 'data', value: data })
      commit('set', { key: 'metadata', value: await getMetadata(state) })
    }
  }
})

async function getTimeseries ({ token, config, runs, options, colors }) {
  const current = { ...config.default }
  const keysPlural = ['variables', 'regions', 'models', 'scenarios']

  options.map((o, i) => config.dropdowns[i].options.find(or => or.label === o)).forEach(o => {
    Object.keys(o).filter(k => k !== 'label').forEach(k => {
      current[k] = o[k]
    })
  })

  keysPlural.forEach(k => {
    current[k] = current[k].map(c => {
      return c.replace(/\$\{([^}]+)\}/g, v => current[v.match(/\$\{(.+)\}/)[1]])
    })
  })

  const filter = {
    filters: {
      runs: runs.filter(r =>
        current.scenarios.indexOf(r.scenario) !== -1 &&
        current.models.indexOf(r.model) !== -1
      ).map(r => r.run),
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

  const data = []
  const keysSingular = ['model', 'region', 'scenario', 'variable']
  timeseries.forEach(entry => {
    let ts = data.find(d => keysSingular.map(k => entry[k] === d[k]).reduce((a, b) => a && b))
    if (ts == null) {
      ts = { series: [] }
      keysSingular.forEach(k => { ts[k] = entry[k] })
      ts.unit = entry.unit
      // ts.color =
      ts.primaryDimension = entry[config.primaryDimension.replace(/s$/, '')]
      ts.color = colors[current[config.primaryDimension].indexOf(ts.primaryDimension)]
      data.push(ts)
    }
    ts.series.push({
      year: entry.year,
      value: entry.value
    })
  })

  const dimensions = keysPlural.filter(d => d !== config.primaryDimension)
  const groups = []
  current[dimensions[0]].forEach(d0 => {
    current[dimensions[1]].forEach(d1 => {
      current[dimensions[2]].forEach(d2 => {
        const obj = {}
        if (current[dimensions[0]].length > 1) obj[dimensions[0]] = d0
        if (current[dimensions[1]].length > 1) obj[dimensions[1]] = d1
        if (current[dimensions[2]].length > 1) obj[dimensions[2]] = d2
        groups.push(obj)
      })
    })
  })

  const dict = config.dict || {}
  const panels = groups.map(g => {
    const name = Object.keys(g).map(k => dict[g[k]] || g[k]).join(' | ')
    const within = data.filter((d, i) => {
      return Object.keys(g).map(k => g[k] === d[k.replace(/s$/, '')]).reduce((a, b) => a && b, [])
    })
    return {
      name,
      within
    }
  })
  return { data: panels, current }
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
