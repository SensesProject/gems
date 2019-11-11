import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const url = 'https://db1.ene.iiasa.ac.at/iamc15-api/rest/v2.1'
const authUrl = 'https://db1.ene.iiasa.ac.at/EneAuth/config/v1/anonym/IXSE_SR15'

export default new Vuex.Store({
  state: {
    config: null,
    text: null,
    token: null,
    runs: null,
    data: null,
    option1: null,
    option2: null,
    colors: ['blue', 'green', 'yellow', 'orange', 'red', 'purple']
  },
  getters: {
    panels: state => {
      if (state.data == null) return []
      return state.data.find(d => d.o1 === state.option1 && d.o2 === state.option2).panels
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
    update ({ commit }, d) {
      commit('set', d)
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
      dispatch('initGem', gem)
    },
    async initGem ({ commit, state }, gem) {
      commit('reset')
      commit('set', { key: 'text', value: await fetch(`./gems/${gem}.md`).then(r => r.text()) })
      const config = await fetch(`./gems/${gem}.json`).then(r => r.json())
      commit('set', { key: 'config', value: config })
      commit('set', { key: 'option1', value: config.option1.default || config.option1.options[0] })
      commit('set', { key: 'option2', value: config.option2.default || config.option2.options[0] })
      commit('set', { key: 'data', value: await getTimeseries(state) })
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

async function getTimeseries ({ token, config, runs }) {
  const fields = ['categories', 'panels', 'option1', 'option2']
  const dimensions = {}
  fields.forEach(f => {
    dimensions[config[f].dimension] = {
      ...config[f],
      field: f
    }
  })
  const filter = {
    filters: {
      runs: runs.filter(r =>
        dimensions.scenario.options.indexOf(r.scenario) !== -1 &&
        dimensions.model.options.indexOf(r.model) !== -1
      ).map(r => r.run),
      regions: dimensions.region.options,
      variables: dimensions.variable.options,
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

  const data = config.option1.options.map(o1 => {
    return config.option2.options.map(o2 => {
      const panels = config.panels.options.map(p => {
        return {
          name: p,
          categories: config.categories.options.map(s => {
            const series = timeseries.filter(d =>
              d[config.panels.dimension] === p &&
              d[config.categories.dimension] === s &&
              d[config.option1.dimension] === o1 &&
              d[config.option2.dimension] === o2
            ).map(({ year, value }) => ({
              year,
              value
            })).sort((a, b) => a.year - b.year)
            return {
              name: s,
              series
            }
          })
        }
      })
      return {
        o1,
        o2,
        panels
      }
    })
  }).flat()
  return data
}
