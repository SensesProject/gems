  <template>
  <div class="gem tiny">
    <template v-if="gem">
        <div class="center header">
          <section class="title">
            <router-link :to="`/${collection.dir}`" class="uppercase collection">{{ collection.name }}</router-link>
            <h1>{{ gem.title }}</h1>
          </section>
        <section>
          <GemExpandable title="What you can explore here">
            <MdParser class="description" :md="gem.description"/>
          </GemExpandable>
        </section>
        <section class="perspective">
          <div class="box block question">
            <div class="label uppercase">Guiding Question</div>
            <SensesRadio :isHorizontal="false" :options="questions" v-model="perspective.question"/>
          </div>
          <div class="box block comparison">
            <div class="label uppercase">Focus</div>
            <SensesRadio :isHorizontal="false" :options="comparisons" v-model="perspective.comparison"/>
          </div>
        </section>
      </div>
      <div class="main">
        <div class="sticky-wrapper">
        <section class="options center">
          <div class="margin-fix">
            <template v-for="(p, i) in gem.params">
              <div v-if="p.name !== perspective.comparison" class="box" :key="`p-${i}`">
                <div class="label uppercase" v-if="p.label">{{ p.name }}</div>
                <SensesRadio :options="p.options.filter(o => !o.hidden).map(o => o.name)" v-model="perspective.params[p.name]" :isEqualWidth="false"/>
              </div>
              <OptionKey v-else :key="`p-${i}`" class="box" :options="cats.filter(o => !o.hidden)" v-model="activeCats" :label="p.label ? perspective.comparison : null" :select-all="!param.singleSelect"/>
            </template>
          </div>
        </section>
          <section class="charts center" :style="{'max-width': size === 'wide' ? `${Math.max(1200, columns * 256)}px` : null}">
            <div class="group " v-for="(g, i) in groups" :key="`g-${i}`">
              <div v-if="g.name || g.icon" class="group-title" :class="{'has-image': g.icon != null}">
                <img v-if="g.icon" :src="g.icon"/>
                <h3 class="uppercase" v-if="g.name">{{g.name}}</h3>
              </div>
              <!-- <div class="margin-fix"> -->
                <div class="panels" :class="[`${size}`]" :style="{'grid-template-columns': size === 'wide' ? `repeat(${Math.min(columns, g.data.filter(p => p.runs.length > 0).length)}, 1fr)` : `repeat(${columns}, 1fr)` }">
                  <ChartLine v-for="(p, j) in g.data.filter(p => p.runs.length > 0)" :key="`${i}-${j}`" :colors="colors" v-bind="p"
                    :number-format="config.numberFormat" :highlight="activeCats" :param="param"
                    :height="size === 'large' ? 360 : 200"
                    :domain="synchronize ? domains[p.runs[0].unit] : null"/>
                </div>
              <!-- </div> -->
            </div>
          </section>
        </div>
        <section class="view center">
          <div class="margin-fix">
            <div class="box" v-if="config && !config.absoluteAxes">
              <div class="label uppercase">Axes</div>
              <SensesRadio :options="[{label: '', value: true}, {label: '', value: false}]" v-model="synchronize"/>
            </div>
            <div class="box sizes">
              <div class="label uppercase">Layout</div>
              <SensesRadio :options="[{label: '', value:'large'}, {label: '', value: 'default'}, {label: '', value: 'wide'}]" v-model="size"/>
            </div>
          </div>
        </section>
      </div>
      <div class="center footer">
        <div class="margin-fix">
          <section class="box data">
            <div class="items">
              <router-link :to="`/${collection.dir}`" class="button">
                ← Back to GEM overview
              </router-link>
              <a v-if="data" class="button" :href="download" :download="filename">
                Download data ↓
              </a>
              <a v-if="workspace" :href="workspace" class="button" target="_blank">
                Open in IIASA Scenario Explorer ↗
              </a>
              <a href="https://data.ene.iiasa.ac.at/iamc-1.5c-explorer/#/license" class="button" target="_blank">
                License ↗
              </a>
            </div>
          </section>
        </div>
        <!-- <div class="margin-fix">
          <section class="box related" v-if="related">
            <div class="items">
              <router-link :to="`/${collection.dir}`" class="button">
                ← Back to GEM overview
              </router-link>
              <a v-if="related.link" class="button" :href="related.link">
                Learn Module
              </a>
            </div>
          </section>
        </div> -->
        <section class="meta" v-if="docs">
          <GemExpandable v-for="m in docs.filter(m => m.items.length > 0)" :key="m.name"
            class="metadata" :title="`${m.name} Metadata`">
            <div class="grid">
              <div
                v-for="(d, i) in m.items"
                :key="`d-${i}`">
                <h3>{{dict[d.name] || d.name}}</h3>
                <div class="description" v-html="d.description"></div>
              </div>
            </div>
          </GemExpandable>
        </section>
      </div>
    </template>
  </div>
</template>
<script>
// import SensesSelect from 'library/src/components/SensesSelect.vue'
import SensesRadio from 'library/src/components/SensesRadio.vue'
import OptionKey from '@/components/OptionKey.vue'
import ChartLine from '@/components/ChartLine.vue'
import MdParser from '@/components/MdParser.vue'
import GemExpandable from '@/components/GemExpandable.vue'
import { mapActions, mapState, mapGetters } from 'vuex'
import bindState from '@/assets/js/bindState'
import { csvFormat } from 'd3-dsv'
import sanitize from 'sanitize-filename'
import { getUrlToResources } from 'library/src/assets/js/utils'
export default {
  name: 'Gem',
  data () {
    return {
      highlight: null,
      synchronize: true,
      // large: false,
      question: null,
      comparison: null,
      params: {},
      activeCats: {}
    }
  },
  components: {
    OptionKey,
    ChartLine,
    // SensesSelect,
    SensesRadio,
    MdParser,
    GemExpandable
  },
  computed: {
    ...mapState(['gem', 'config', 'colors', 'data', 'metadata', 'current', 'domains', 'gems', 'modules']),
    ...mapGetters(['dict']),
    ...bindState(['options', 'perspective', 'size']),
    columns () {
      const max = this.groups != null ? Math.max(...this.groups.map(g => g.data.filter(p => p.runs.length > 0).length)) : 8
      switch (this.size) {
        case 'large':
          return Math.min(2, max)
        case 'wide':
          return Math.min(8, max)
        default:
          return Math.min(4, max)
      }
    },
    workspace () {
      return (this.gem.questions.find(a => a.name === this.perspective.question) || {}).workspace || this.gem.workspace
    },
    questions () {
      const { gem } = this
      return gem.questions.map(p => p.name)
    },
    comparisons () {
      const { gem } = this
      return gem.params.map(p => p.name)
    },
    param () {
      const { gem, perspective } = this
      if (gem === null) return
      return gem.params.find(p => p.name === perspective.comparison)
    },
    cats () {
      const { gem, param, colors } = this
      if (gem === null) return
      return param.options.map((o, i) => ({ ...o, label: o.name, color: param.monochrome ? 'yellow' : colors[i] }))
    },
    docs () {
      const { metadata } = this
      return metadata
    },
    groups () {
      const { config, data, gem, perspective } = this
      if (config == null || data == null) return

      const question = gem.questions.find(q => q.name === perspective.question)
      const groups = question.groups
      if (groups == null) return [{ data }]
      return groups.map(g => {
        const variables = (g.config.variables || (question.config && question.config.variables ? question.config.variables : (gem.config && gem.config.variables ? gem.config.variables : []))).map(d => d.value || d)
        const regions = (g.config.regions || (question.config && question.config.regions ? question.config.regions : (gem.config && gem.config.regions ? gem.config.regions : []))).map(d => d.value || d)

        const panels = data.filter(panel =>
          (variables.find(d => d === panel.variable)) &&
          (regions.find(d => d === panel.region))
        )
        return {
          data: panels,
          name: g.name,
          icon: g.icon ? `./icons/${g.icon}.png` : null
        }
      })

      // return [{ data }]
      // let start = 0
      // return config.groups.map(g => {
      //   const d = data.filter((d, i) => i >= start && i < start + g.size)
      //   start += g.size
      //   return {
      //     label: g.label,
      //     img: g.img,
      //     data: d
      //   }
      // })
    },
    collection () {
      const { $route, gems } = this
      const module = gems.find(g => g.dir === $route.params.module)
      if (module == null) return {}
      return { name: module.title, dir: module.dir }
    },
    related () {
      const { $route, gems, modules } = this
      const module = gems.find(g => g.dir === $route.params.module)
      if (module == null) return null
      const relatedGems = module.gems.filter(gem => gem.id !== $route.params.gem).map(gem => ({
        title: gem.title || gem.id,
        path: `/${module.dir}/${gem.id}`
      }))
      let link = null
      if (modules != null) {
        const m = modules.modules.find(m => m.id === module.id)
        if (m) {
          link = getUrlToResources(m.link)
        }
      }
      return {
        gems: relatedGems,
        module,
        link
      }
    },
    download () {
      const data = this.data.map(p => {
        return p.runs.map(r => {
          return {
            region: p.region,
            variable: p.variable,
            unit: r.unit,
            model: r.model,
            scenario: r.scenario,
            ...Object.fromEntries(r.series.map(y => [y.year, y.value]))
          }
        })
      }).flat()

      const attrKeys = ['model', 'scenario', 'region', 'variable', 'unit']
      const keys = [...new Set(data.map(d => Object.keys(d)).flat())].sort().filter(k => attrKeys.find(k2 => k === k2) == null)

      return encodeURI(`data:text/csv;charset=utf-8,${csvFormat(data, [...attrKeys, ...keys])}`)
    },
    filename () {
      const { $route, questions, perspective } = this
      const segments = [
        $route.params.module,
        $route.params.gem,
        `Q${questions.indexOf(perspective.question) + 1}`,
        perspective.comparison,
        Object.keys(perspective.params).map(p => p === perspective.comparison ? null : perspective.params[p]).filter(p => p != null).join('-')
      ]
      return sanitize(`${segments.join('_')}.csv`)
    }
  },
  methods: {
    ...mapActions(['initGem', 'initSession'])
  },
  created () {
    this.initSession(this.$route.params)
  },
  watch: {
    '$route.params.gem': {
      handler () {
        this.initGem(this.$route.params)
      },
      deep: true
    },
    cats (cats) {
      const { param } = this
      if (cats == null) return
      this.activeCats = Object.fromEntries(cats.map((c, i) => [c.name, i === 0 || !param.singleSelect]))
    },
    // 'options': { // force update options in state
    //   handler (o) {
    //     this.options = o
    //   },
    //   deep: true
    // }
    perspective: { // force update options in state
      handler (perspective) {
        this.perspective = perspective
      },
      deep: true
    }
  }
}
</script>
<style lang="scss" scoped>
@import "library/src/style/global.scss";

.gem {
  padding: $spacing / 2 $spacing / 2 $spacing / 2;

  section + section {
    margin-top: $spacing / 2;
  }
  .header {
    .title {
      .collection {
        background: none;
        margin-bottom: $spacing / 16;
        display: inline-block;
      }
      h1 {
        transform: translateX(-1.25px);
      }
    }

    .description {
      columns: 3;
      column-gap: $spacing / 2;
      &::v-deep p + p {
        text-indent: 2em;
      }

      @include max-width($medium) {
        columns: 2
      }

      @include max-width($narrow) {
        columns: 1
      }
    }

    .perspective {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: $spacing / 2;

      @include max-width($narrow) {
        grid-template-columns: repeat(1, 1fr);
        grid-gap: $spacing / 2 0;
      }

      .question {
        grid-column-start: 1;
        grid-column-end: 3;
      }
    }
  }
  .margin-fix {
    margin-right: -$spacing / 2;
    display: flex;
    flex-wrap: wrap;
    // margin-bottom: -$spacing / 2;
    .box {
      margin: 0 $spacing / 2 $spacing / 2 0;
      .label {
        white-space: nowrap;
      }
    }
  }
  .main {
    // .sticky-wrapper {
    //   padding-bottom: $spacing;
    // }
    .options {
      margin-top: $spacing / 2;
      position: sticky;
      top: $spacing * 2.25;
      z-index: 1;
    }
    .view {
      // margin-top: $spacing / 2;
      position: sticky;
      bottom: 0;
      z-index: 1;

      .senses-radio ::v-deep {
        label {
          font-family: 'gem-view';
          font-size: 16px;
          line-height: 1.1;
          padding-left: 0 !important;
        }
      }

      .sizes {
        @include max-width($medium) {
          display: none !important;
        }
        @include max-width($wide) {
          ::v-deep {
            label:last-of-type {
              display: none !important;
            }
            label:nth-last-of-type(2) {
              margin-right: 0 !important;
            }
          }
        }
      }
    }
    .charts {
      padding-bottom: $spacing / 2;
      margin-top: 0;

      .group {

        margin: 0 0 $spacing / 2 0;
        border-top: 1px solid getColor(neon, 60);
        padding-top: $spacing / 4;

        .group-title {
          margin-bottom: $spacing / 8;
          display: flex;
          align-items: center;
          img {
            height: 2em;
            margin-right: $spacing / 4;
          }
          h3 {
            color: $color-neon;
            font-weight: $font-weight-regular;
          }
          &.has-image {
            margin-bottom: $spacing / 4;
          }
        }

        &:last-child {
          border-bottom: 1px solid getColor(neon, 60);
          padding-bottom: $spacing / 2;
          margin: 0;
        }
      }

      .panels {
        display: grid;
        grid-gap: $spacing / 2;
        @include max-width($medium) {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        @include max-width($narrow) {
          grid-template-columns: repeat(1, 1fr) !important;
        }
      }
    }
  }

  .footer {
    .margin-fix {
      margin-right: 0;
    }
    .items {
      margin-bottom: -$spacing / 8;
      .button {
        margin: 0 $spacing / 8 $spacing / 8 0;

        &:last-child {
          margin-right: 0;
        }
      }
    }

    .metadata {
      margin-bottom: $spacing / 2;
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: $spacing / 2;

        @include max-width($medium) {
          grid-template-columns: repeat(2, 1fr);
        }

        @include max-width($narrow) {
          grid-template-columns: repeat(1, 1fr);
        }

        h3 {
          margin-bottom: $spacing / 8;
          color: $color-neon;
          font-weight: $font-weight-regular;
        }
        .description ::v-deep {
          * {
            font-size: 1em;
            color: $color-black;
          }
          h1, h2, h3, h4 {
            margin-top: $spacing / 8;
          }
          a {
            background: linear-gradient(to top, transparent 0.1em, $color-black 0.1em, $color-black 0.2em, transparent 0.2em);
          }
        }
      }
    }
  }
}
</style>
