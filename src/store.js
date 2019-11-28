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
    colors: ['blue', 'green', 'yellow', 'orange', 'red', 'purple']
  },
  getters: {
    // panels: state => {
    //   if (state.data == null) return []
    //   return state.data
    // }
    config: state => {
      if (state.configs == null) return null
      return state.configs.find(c => c.name === state.name)
      // return state.data
    }
  },
  mutations: {
    set (state, { key, value }) {
      state[key] = value
      // if (key === 'name') 
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
    async initGem ({ commit, dispatch }, gem) {
      console.log('init')
      commit('reset')
      commit('set', { key: 'text', value: await fetch(`./gems/${gem}.md`).then(r => r.text()) })
      const configs = await fetch(`./gems/${gem}.json`).then(r => r.json())
      commit('set', { key: 'configs', value: configs })
      commit('set', { key: 'name', value: configs[0].name })
      // commit('set', { key: 'option2', value: config.option2.default || config.option2.options[0] })
      dispatch('updateTimeseries')
      // commit('set', { key: 'data', value: await getTimeseries(state) })
    },
    async updateTimeseries ({ commit, state }) {
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

async function getTimeseries ({ token, configs, name, runs }) {
  const config = configs.find(c => c.name === name)
  // const fields = ['categories', 'panels', 'option1', 'option2']
  // const dimensions = {}
  // fields.forEach(f => {
  //   dimensions[config[f].dimension] = {
  //     ...config[f],
  //     field: f
  //   }
  // })
  const filter = {
    filters: {
      runs: runs.filter(r =>
        config.scenarios.indexOf(r.scenario) !== -1 &&
        config.models.indexOf(r.model) !== -1
      ).map(r => r.run),
      regions: config.regions,
      variables: config.variables,
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

  console.log(timeseries)

  // const data = config.option1.options.map(o1 => {
  //   return config.option2.options.map(o2 => {
  const data = config[config.across].map(across => {
    return {
      name: across,
      within: config[config.within].map(within => {
        const series = timeseries.filter(d =>
          d.variable === (config.across === 'variables' ? across : config.within === 'variables' ? within : config.variables[0]) &&
          d.model === (config.across === 'models' ? across : config.within === 'models' ? within : config.models[0]) &&
          d.scenario === (config.across === 'scenarios' ? across : config.within === 'scenarios' ? within : config.scenarios[0]) &&
          d.region === (config.across === 'regions' ? across : config.within === 'regions' ? within : config.regions[0])
        ).map(({ year, value }) => ({
          year,
          value
        })).sort((a, b) => a.year - b.year)
        return {
          name: within,
          series
        }
      })
    }
  })
  //     })
  //     return {
  //       o1,
  //       o2,
  //       panels
  //     }
  //   })
  // }).flat()
  console.log(data)
  return data
}
