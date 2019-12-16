import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const url = 'https://db1.ene.iiasa.ac.at/iamc15-api/rest/v2.1'
const authUrl = 'https://db1.ene.iiasa.ac.at/EneAuth/config/v1/anonym/IXSE_SR15'

export default new Vuex.Store({
  state: {
    configs: null,
    text: null,
    token: null,
    runs: null,
    data: null,
    option1: null,
    name: null,
    colors: ['blue', 'green', 'yellow', 'orange', 'red', 'purple'],
    regions: null,
    models: null,
    scenarios: null,
    metadata: null
  },
  getters: {
    config: state => {
      if (state.configs == null) return null
      return state.configs.find(c => c.name === state.name)
    }
  },
  mutations: {
    set (state, { key, value }) {
      state[key] = value 
    },
    reset (state) {
      state.config = null
      state.text = null
      state.data = null
      state.option1 = null
      state.option2 = null
    }
  },
  actions: {
    update ({ commit, dispatch }, d) {
      commit('set', d)
      if (d.key === 'name') dispatch('updateTimeseries')
      if (d.key === 'name') dispatch('updateMetadata')
    },
    async initSession ({ commit, state, dispatch }, gem) {
      if (state.token == null) {
        const token = await auth()
        commit('set', { key: 'token', value: token })
      }
      if (state.runs == null) {
        const runs = await getRuns(state.token)
        commit('set', { key: 'runs', value: runs })
      }
      if (state.regions == null) {
        const regions = await fetch(`${url}/nodes?hierarchy=*`, { headers: { Authorization: `Bearer ${state.token}` } }).then(r => r.json())
        commit('set', { key: 'regions', value: regions })
      }
      if (state.models == null) {
        const models = await fetch(`${url}/models`, { headers: { Authorization: `Bearer ${state.token}` } }).then(r => r.json())
        commit('set', { key: 'models', value: models })
      }
      if (state.scenarios == null) {
        const scenarios = await fetch(`${url}/scenarios`, { headers: { Authorization: `Bearer ${state.token}` } }).then(r => r.json())
        commit('set', { key: 'scenarios', value: scenarios })
      }
      dispatch('initGem', gem)
    },
    async initGem ({ commit, dispatch }, gem) {
      commit('set', { key: 'text', value: await fetch(`./gems/${gem}.md`).then(r => r.text()) })
      const configs = await fetch(`./gems/${gem}.json`).then(r => r.json())
      commit('set', { key: 'configs', value: configs })
      commit('set', { key: 'name', value: configs[0].name })
      dispatch('updateTimeseries')
      dispatch('updateMetadata')
    },
    async updateTimeseries ({ commit, state }) {
      commit('set', { key: 'data', value: await getTimeseries(state) })
    },
    async updateMetadata ({ commit, state }) {
      commit('set', { key: 'metadata', value: await getMetadata(state) })
    }
  }
})

async function auth () {
  const token = await fetch(authUrl).then(r => r.json())
  return token
}

async function getRuns (token) {
  const runs = await fetch(`${url}/runs`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
  return runs.map(r => ({
    model: r.model,
    scenario: r.scenario,
    run: r.run_id
  }))
}

async function getTimeseries ({ token, configs, name, runs }) {
  const config = configs.find(c => c.name === name)
  const variables = config.variables.map(v => v.value || v)
  const scenarios = config.scenarios.map(s => s.value || s)
  const models = config.models.map(m => m.value || m)
  const regions = config.regions.map(r => r.value || r)
  const filter = {
    filters: {
      runs: runs.filter(r =>
        scenarios.indexOf(r.scenario) !== -1 &&
        models.indexOf(r.model) !== -1
      ).map(r => r.run),
      regions,
      variables,
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

  const data = config[config.across].map(across => {
    return {
      name: across.label || across,
      within: config[config.within].map(within => {
        const filtered = timeseries.filter(d =>
          d.variable === (config.across === 'variables' ? (across.value || across) : config.within === 'variables' ? (within.value || within) : variables[0]) &&
          d.model === (config.across === 'models' ? (across.value || across) : config.within === 'models' ? (within.value || within) : models[0]) &&
          d.scenario === (config.across === 'scenarios' ? (across.value || across) : config.within === 'scenarios' ? (within.value || within) : scenarios[0]) &&
          d.region === (config.across === 'regions' ? (across.value || across) : config.within === 'regions' ? (within.value || within) : regions[0])
        )
        const series = filtered.map(({ year, value }) => ({
          year,
          value
        })).sort((a, b) => a.year - b.year)
        return {
          name: within.label || within,
          series,
          unit: filtered[0].unit
        }
      })
    }
  })
  return data
}

async function getMetadata ({ token, configs, name, regions, scenarios, models }) {
  const config = configs.find(c => c.name === name)
  // const docs = {
  //   regions, scenarios, models
  // }
  // const across = (docs[config.across]) ? config[config.across]
  //   .map(d => docs[config.across].find(c => (d.value || d) === c.name))
  //   .filter(d => d != null)
  //   .map(d => `/${config.across}/${d.id}`) : []
  // // const within = (docs[config.within]) ? config[config.within]
  // //   .map(d => docs[config.within].find(c => (d.value || d) === c.name))
  // //   .filter(d => d != null)
  // //   .map(d => `/${config.within}/${d.id}`) : []

  const r = regions ? config.regions
    .map(d => regions.find(c => (d.value || d) === c.name))
    .filter(d => d != null)
    .map(d => `/regions/${d.id}`) : []

  const s = scenarios ? config.scenarios
    .map(d => scenarios.find(c => (d.value || d) === c.name))
    .filter(d => d != null)
    .map(d => `/scenarios/${d.id}`) : []

  const m = models ? config.models
    .map(d => models.find(c => (d.value || d) === c.name))
    .filter(d => d != null)
    .map(d => `/models/${d.id}`) : []

  // console.log([...across, ...within])


  // const keys = {
  //   filters: {
  //     runs: runs.filter(r =>
  //       scenarios.indexOf(r.scenario) !== -1 &&
  //       models.indexOf(r.model) !== -1
  //     ).map(r => r.run),
  //     regions,
  //     variables,
  //     units: [],
  //     years: [],
  //     times: []
  //   }
  // }
  const docs = await fetch(`${url}/docs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({keys: [...s, ...r, ...m]})
  }).then(r => r.json())
  console.log(docs)
  return docs
}