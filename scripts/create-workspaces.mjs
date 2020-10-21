import fetch from 'node-fetch'
import { promises as fs } from 'fs'

import credentials from './credentials.json'

const url = 'https://db1.ene.iiasa.ac.at/ixmp-api-sandbox/rest/v2.1'
const authUrl = 'https://db1.ene.iiasa.ac.at/EneAuth/config/v1/login'
const explorerUrl = 'https://data.ene.iiasa.ac.at/ixmp-explorer-sandbox'

const path = process.argv[2]
if (path === undefined) {
  console.log(`\npath to file missing – please use 'npm run generate [path-to-gem-config]'\n`)
  process.exit(1)
}

// console.log(credentials, gems)

async function main () {
  const token = await auth()
  const options = { headers: { Authorization: `Bearer ${token}` } }
  const basics = await getBasics(options)

  // console.log(basics)

  // const configs = []
  const gem = JSON.parse(await fs.readFile(path, 'utf8'))
  const questions = []
  for (const question of gem.questions) {
    const config = parseConfigs({ gem, question })
    const runs = runIDs(config, basics)
    const timeseries = timeseriesIDs(config, basics)
    const regions = regionIDs(config, basics)
    const body = getBody(gem, question, regions, timeseries, runs)
    const workspace = await fetch(`${url}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: options.headers.Authorization
      },
      body: JSON.stringify(body)
    }).then(r => r.json())
    const workspaceUrl = `${explorerUrl}///////#/workspaces/share/${workspace.accessToken}`
    console.log(`Created Workspace: ${workspaceUrl}`)
    questions.push({
      ...question,
      workspace: workspaceUrl
    })
  }

  await fs.writeFile(path, JSON.stringify({
    ...gem,
    questions
  }, null, 2), 'utf8')

  console.log(`updated gem: ${path}`)
}

function getBody (gem, question, regions, timeseries, runs) {
  return {
    name: gem.title,
    description: question.name,
    panels: regions.map(region => {
      return timeseries.map(ts => {
        // console.log(ts)
        return {
          selection: {
            metadata: [],
            runs,
            characteristics: {
              timeseries: [ts.id]
            },
            regions: [region.id],
            units: []
          },
          options: {
            name: `${region.name} – ${ts.name}`,
            description: '',
            showAs: 'chart-line',
            size: 'half'
          }
        }
      })
    }).flat().map((panel, id) => ({ ...panel, id })),
    'publishType': 'UNLISTED',
    'hasPreview': true
  }
}

function regionIDs (config, basics) {
  return config.regions
    .map(a => ({ name: a, id: basics.regions.find(b => a === b.name).id }))
}

function timeseriesIDs (config, basics) {
  return config.variables
    .map(a => ({ name: a, id: basics.timeseries.find(b => a === b.variable).id }))
}

function runIDs (config, basics) {
  return config.runs
    .map(a => basics.runs.find(b => a.model === b.model && a.scenario === b.scenario))
    .filter(a => a !== undefined)
    .map(a => a.run_id)
}

async function auth () {
  const token = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  }).then(r => { return r.json() })
  console.log('authenticated successfully')
  return token
}

async function getBasics (options) {
  return {
    runs: await fetch(`${url}/runs`, options).then(r => r.json()),
    regions: await fetch(`${url}/nodes?hierarchy=*`, options).then(r => r.json()),
    // models: await fetch(`${url}/models`, options).then(r => r.json()),
    // scenarios: await fetch(`${url}/scenarios`, options).then(r => r.json()),
    timeseries: await fetch(`${url}/ts`, options).then(r => r.json())
  }
}

function parseConfigs ({ gem, question }) {
  let config = { ...gem.config }

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
    const options = p.options
    config.runs = options.map(option => {
      return config.runs.map(r => {
        let { model, scenario } = r
        const interpolations = Object.fromEntries(Object.keys(option).filter(k => k !== 'name').map(k => [k, option[k]]))
        Object.keys(interpolations).forEach(k => {
          model = model.replace(k, option[k])
          scenario = scenario.replace(k, option[k])
        })
        return { ...r, model, scenario, params: { ...r.params, ...Object.fromEntries([[p.name, option.name]]) } }
      })
    }).flat()
  })
  return config
}

main()
