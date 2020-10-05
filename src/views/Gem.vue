  <template>
  <div class="gem">
    <template v-if="gem">
      <section class="intro grid">
        <h1>{{ gem.title }}</h1>
        <MdParser :md="gem.description"/>
      </section>
      <section class="config-1 tint">
        <div class="grid">
          <div class="question">
            <div class="label tiny"><strong>Guiding Question</strong></div>
            <SensesRadio :isHorizontal="false" :options="questions" v-model="perspective.question"/>
          </div>
          <div class="comparison">
            <div class="label tiny"><strong>Comparison</strong></div>
            <SensesRadio :isHorizontal="false" :options="comparisons" v-model="perspective.comparison"/>
          </div>
        </div>
      </section>
      <!-- <section class="intro grid">
        <MdParser :md="gem.description"/>
      </section> -->
      <section class="config-2 tint">
        <div class="grid">
          <div class="param" v-for="(p, i) in gem.params.filter(p => p.name !== perspective.comparison)" :key="`p-${i}`">
            <div class="label tiny">{{ p.name }}</div>
            <component :is="p.radio ? 'SensesRadio' : 'SensesSelect'" :options="p.options.filter(o => !o.hidden).map(o => o.name)" v-model="perspective.params[p.name]"/>
          </div>
        </div>
      </section>
      <div class="section-wrapper">
        <section class="key tint">
          <div class="grid">
            <div class="param" v-for="(p, i) in gem.params.filter(p => p.name !== perspective.comparison)" :key="`p-${i}`">
              <div class="label tiny">{{ p.name }}</div>
              <component :is="p.radio ? 'SensesRadio' : 'SensesSelect'" :options="p.options.filter(o => !o.hidden).map(o => o.name)" v-model="perspective.params[p.name]"/>
            </div>
            <OptionKey class="cats" :options="cats.filter(o => !o.hidden)" v-model="activeCats" :label="perspective.comparison" :select-all="!param.singleSelect"/>
            <!-- <div class="tiny label">{{ perspective.comparison }}</div>
            <div class="cats">
              <span v-for="(cat, i) in cats" :key="`o-${i}`" class="highlight cat" :class="colors[i]">
                {{ cat.name }}
              </span>
            </div> -->
            <!-- <div class="tiny label">Models/Scenarios</div>
            <span v-for="(r, i) in config.runs" :key="`r-${i}`"
              class="tiny" :class="{ transparent: highlight != null && highlight != r.runId }"
              @mouseenter="highlight = r.runId" @mousemove="highlight = r.runId" @mouseout="highlight = null">
              <span class="glyph-dot" :class="r.color"/>
              {{r[0]}} -- {{r[1]}}
            </span> -->
            <!-- <span v-if="current.funnel != null"
              class="tiny" :class="{ transparent: highlight != null }">
              <span class="glyph-rect funnel"/>
              The shaded area shows the model spread.
            </span> -->
          </div>
        </section>
        <section class="charts">
          <div class="group " v-for="(g, i) in groups" :key="`g-${i}`">
            <div v-if="g.name || g.icon" class="group-title" :class="{'first-title': i === 0}">
              <img v-if="g.icon" :src="g.icon"/>
              <h3 v-if="g.name">{{g.name}}</h3>
            </div>
            <div class="panels grid" :class="[size]">
              <ChartLine v-for="(p, j) in g.data.filter(p => p.runs.length > 0)" :key="`${i}-${j}`" :colors="colors" v-bind="p"
                :number-format="config.numberFormat" :highlight="activeCats" :param="param"
                :height="size === 'huge' ? 500 : size === 'large' ? 400 : size === 'medium' ? 300 : 200"
                :large="size === 'huge'"
                :domain="synchronize ? domains[p.runs[0].unit] : null"/>
            </div>
          </div>
        </section>
        <section class="layout tint">
          <div class="grid">
            <div class="param" v-if="config && !config.absoluteAxes">
              <div class="tiny label axis">Axes</div>
              <SensesRadio :options="[{label: 'synced', value: true}, {label: 'unsynced', value: false}]" v-model="synchronize"/>
            </div>
            <div class="param">
              <div class="tiny label axis">Layout</div>
              <SensesRadio :options="['small', {label: 'default', value: 'medium'}, 'large', 'huge']" v-model="size"/>
            </div>
          </div>
        </section>
      </div>
      <section class="grid links">
        <div v-if="data" class="download">
          <h3>Data</h3>
          <ul>
            <a class="link invert" :href="download" :download="filename">
              <li>Download Data ↓</li>
            </a>
          </ul>
        </div>
        <div v-if="workspace" class="workspace">
          <ul>
            <a :href="workspace" class="link invert" target="_blank">
              <li>Open workspace in IIASA Scenario Explorer ↗</li>
            </a>
          </ul>
        </div>
      </section>
      <section class="grid more">
        <div v-if="related" class="related">
          <template v-if="related.link != null">
            <h3>Related Module</h3>
            <ul class="border">
              <a class="link" :href="related.link">
                <li>Read the module</li>
              </a>
            </ul>
            <br>
          </template>
          <h3>Related GEMs</h3>
          <ul class="border">
            <router-link v-for="(link, i) in related.gems" :key="`g-${i}`" class="link" :to="link.path">
              <li>{{ link.title }}</li>
            </router-link>
          </ul>
        </div>
      </section>
      <section class="grid meta">
        <div class="metadata">
          <h3>Metadata</h3>
          <table>
            <template v-for="m in docs">
              <template v-if="m.items.length > 0">
                <thead :key="`m1-${m.name}`">
                  <tr>
                    <th>{{ m.name }}</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody :key="`m2-${m.name}`">
                  <tr
                    v-for="(d, i) in m.items"
                    :key="`d-${i}`">
                    <td class="bold">{{dict[d.name] || d.name}}</td>
                    <td v-html="d.description"></td>
                  </tr>
                </tbody>
              </template>
            </template>
          </table>
        </div>
      </section>
    </template>
    <!-- <div class="grid grid-test">
      <div/>
      <div/>
      <div/>
      <div/>
      <div/>
      <div/>
      <div/>
    </div> -->
    <template v-if="config && current">
      <div class="options" v-if="config != null">
        <div class="option" v-for="(o,i) in config.dropdowns" :key="`o-${i}`">
          <div class="tiny label">{{ o.label }}</div>
          <SensesSelect width="120" :options="o.options.map(c => c.label)" v-model="options[i]"/>
        </div>
      </div>
      <section v-if="current.text" class="text">
        <MdParser :md="current.text"/>
      </section>
      <div class="options" v-if="config != null">
        <div class="option" v-if="data && Object.keys(domains).length !== data.length">
          <div class="tiny label axis">Axis</div>
          <SensesRadio width="120" :options="[{label: 'absolute', value: false}, {label: 'synchronized', value: true}]" v-model="synchronize"/>
        </div>
      </div>
      <div class="legend" v-if="current != null">
        <div class="legend-inner">
          <div class="tiny label">Models/Scenarios</div>
          <span v-for="(r, i) in current.all.filter(r => r.type === 'default' || r.type === 'reference')" :key="`o${i}`"
            class="tiny" :class="{ transparent: highlight != null && highlight != r.runId }"
            @mouseenter="highlight = r.runId" @mousemove="highlight = r.runId" @mouseout="highlight = null">
            <span class="glyph-dot" :class="r.color"/>
            {{ dict[r.name] || r.name }}
          </span><br>
          <span v-if="current.funnel != null"
            class="tiny" :class="{ transparent: highlight != null }">
            <span class="glyph-rect funnel"/>
            The shaded area shows the model spread.
          </span>
        </div>
      </div>
      <div class="group" v-for="(g, i) in groups" :key="`g-${i}`">
        <div class="group-title">
          <img v-if="g.img" :src="g.img"/>
          <h3 v-if="g.label">{{g.label}}</h3>
        </div>
        <div class="panels">
          <ChartLine v-for="(p, j) in g.data.filter(p => p.runs.length > 0)" :key="`${i}-${j}`" :colors="colors" v-bind="p"
            :number-format="config.numberFormat" :highlight="highlight"
            :domain="synchronize ? domains[p.runs[0].unit] : null"/>
        </div>
      </div>
    </template>
  </div>
</template>
<script>
import SensesSelect from 'library/src/components/SensesSelect.vue'
import SensesRadio from 'library/src/components/SensesRadio.vue'
import OptionKey from '@/components/OptionKey.vue'
import ChartLine from '@/components/ChartLine.vue'
import MdParser from '@/components/MdParser.vue'
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
    SensesSelect,
    SensesRadio,
    MdParser
  },
  computed: {
    ...mapState(['gem', 'config', 'colors', 'data', 'metadata', 'current', 'domains', 'gems', 'modules']),
    ...mapGetters(['dict']),
    ...bindState(['options', 'perspective', 'size']),
    workspace () {
      return this.questions.find(a => a.name === this.perspective.question).workspace || this.gem.workspace
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

      const groups = gem.questions.find(q => q.name === perspective.question).groups
      if (groups == null) return [{ data }]

      return groups.map(g => {
        const variables = (g.config.variables || []).map(d => d.value || d)
        const regions = (g.config.regions || []).map(d => d.value || d)

        const panels = data.filter(panel =>
          (variables.length === 0 || variables.find(d => d === panel.variable)) &&
          (regions.length === 0 || regions.find(d => d === panel.region))
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

@mixin dot {
  text-indent: -$spacing * 0.35;
  &::before {
    content: "";
    background: $color-black;
    width: $spacing * 0.2;
    height: $spacing * 0.2;
    transform: translateY(-2px);
    border-radius: 50%;
    display: inline-block;
    margin-right: $spacing * 0.15;
  }
}

.gem {
  padding: $spacing / 2 $spacing / 2 0 $spacing / 2;

  section + section {
    margin-top: $spacing / 2;

    &.charts {
      margin-top: 0;
    }
  }

  section.tint, .group-title.tint {
    background: transparentize(getColor(gray, 90), 0.02);
    @supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or(backdrop-filter: saturate(180%) blur(20px))) {
      background: transparentize(getColor(gray, 90), 0.15);
      -webkit-backdrop-filter: saturate(180%) blur(10px);
      backdrop-filter:saturate(180%) blur(10px)
    }
    padding: $spacing / 2;
    margin: $spacing / 2 #{-$spacing / 2} 0;

    & + .tint {
      margin-top: 1px;
    }
  }

  .grid {
    $column: 240px;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    max-width: $column * 7;

    // &.tint {
    //   max-width: calc(#{$column * 7} + #{$spacing});
    // }
    @include min-width($column * 2) {
      grid-template-columns: repeat(2, 1fr);
    }
    @include min-width($column * 3) {
      grid-template-columns: repeat(3, 1fr);
    }
    @include min-width($column * 4) {
      grid-template-columns: repeat(4, 1fr);
    }
    @include min-width($column * 5) {
      grid-template-columns: repeat(5, 1fr);
    }
    @include min-width($column * 6) {
      grid-template-columns: repeat(6, 1fr);
    }

    gap: $spacing / 2;

    &.large {
      $column: 480px;
      grid-template-columns: repeat(1, 1fr);
      @include min-width($column * 2) {
        grid-template-columns: repeat(2, 1fr);
      }
      @include min-width($column * 3) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    &.huge {
      grid-template-columns: repeat(1, 1fr);
    }

    &.medium {
      $column: 320px;
      grid-template-columns: repeat(1, 1fr);
      @include min-width($column * 2) {
        grid-template-columns: repeat(2, 1fr);
      }
      @include min-width($column * 3) {
        grid-template-columns: repeat(3, 1fr);
      }
      @include min-width($column * 4) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    &.grid-test {
      > div {
        background: $color-neon;
        height: $spacing * 6;
      }
    }
  }

  .intro {
    > * {
      grid-column-start: 1;
      grid-column-end: 4;
    }
  }
  ::v-deep .intro {
    ul {
      list-style: none;
      li {
        @include dot;
      }
    }
  }
  .config-1 {
    .question {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }

  ::v-deep .config-1 {
    .senses-radio {
      display: block;

      label {
        background: none;
        border-radius: 0;
        margin: 0;
        padding: 0;
        color: $color-black;
        transition: color $transition;

        &:hover {
          text-decoration: underline;
        }

        span {
          text-align: left;
          padding: 0;
          line-height: inherit;
        }

        input:checked + span {
          color: inherit;
          text-decoration: underline;
          @include dot;
        }
      }
    }
  }

  ::v-deep .config-2, ::v-deep .layout, ::v-deep .key {
    .senses-select {
      width: 100%;
      > * {
        width: 100%;
        > * {
          width: 100%;
        }
      }
    }
    .senses-radio {
      width: 100%;
      display: block;
      .radio label input + span {
        line-height: inherit;
        padding: 0 $spacing / 8;
      }
    }
  }

  .key {
    // background: transparentize(getColor(gray, 90), 0.02);
    z-index: 10;
    // @supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or(backdrop-filter: saturate(180%) blur(20px))) {
    //   background: transparentize(getColor(gray, 90), 0.15);
    //   -webkit-backdrop-filter: saturate(180%) blur(10px);
    //   backdrop-filter:saturate(180%) blur(10px)
    // }
    @include min-width($narrow) {
      top: $spacing * 2;
      position: sticky;
    }

    &.tint {
      margin-top: 1px;
    }

    .cats {
      grid-column-start: 1;
      grid-column-end: 5;
    }
  }

  .layout {
    // background: transparentize(getColor(gray, 90), 0.02);
    z-index: 9;
    // @supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or(backdrop-filter: saturate(180%) blur(20px))) {
    //   background: transparentize(getColor(gray, 90), 0.15);
    //   -webkit-backdrop-filter: saturate(180%) blur(10px);
    //   backdrop-filter:saturate(180%) blur(10px)
    // }
    @include min-width($narrow) {
      bottom: 0;
      position: sticky;
    }

    &.tint {
      margin-top: 1px;
    }

    .cats {
      grid-column-start: 1;
      grid-column-end: 5;
    }
  }

  // flex-direction: column;
  // align-items: center;
  // padding: $spacing $spacing / 2;

  // .intro {
  //   width: 100%;
  //   max-width: 600px;
  //   margin-bottom: $spacing;
  // }

  // .text {
  //   width: 100%;
  //   max-width: 600px;
  //   margin: $spacing / 2 0;
  // }

  // .options {
  //   width: 100%;
  //   max-width: 600px;
  //   display: flex;
  //   flex-wrap: wrap;
  //   align-items: center;

  //   .option {
  //     margin: 0 $spacing / 4 $spacing / 8 0;
  //     .label {
  //       text-transform: capitalize;
  //       &.axis {
  //         margin-bottom: -5px;
  //       }
  //     }
  //     &:last-of-type {
  //       margin-right: 0;
  //     }
  //   }
  // }

  // .legend {
  //   background: transparentize($color-white, 0.02);
  //   z-index: 10;
  //   @supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or(backdrop-filter: saturate(180%) blur(20px))) {
  //     background: transparentize($color-white, 0.15);
  //     -webkit-backdrop-filter: saturate(180%) blur(10px);
  //     backdrop-filter:saturate(180%) blur(10px)
  //   }
  //   top: $spacing * 2;
  //   position: sticky;
  //   width: 100vw;
  //   display: flex;
  //   padding: 0 $spacing / 2 $spacing / 4;
  //   // align-items: center;
  //   justify-content: center;
  //   // padding-bottom: $spacing / 4;
  //   .legend-inner {
  //     width: 100%;
  //     max-width: 600px;
  //     margin-top: $spacing / 8;
  //     .label {
  //       text-transform: capitalize;
  //       margin-bottom: -$spacing / 16;
  //     }
  //     > span {
  //       margin-right: $spacing / 4;
  //       display: inline-block;
  //       cursor: default;
  //       transition: opacity $transition;

  //       &.transparent {
  //         opacity: .6;
  //       }
  //         // white-space: nowrap;
  //       .glyph-dot {
  //         &:before {
  //           content: '●';
  //           font-family: $font-sans;
  //           margin: 0;
  //         }
  //         @include tint(color);
  //         &.light {
  //           @include tint(color, 60);
  //         }
  //         &.dark {
  //           @include tint(color, 40);
  //         }
  //       }
  //       .glyph-rect {
  //         &:before {
  //           content: '●';
  //           font-family: $font-sans;
  //           margin: 0;
  //           background: getColor(neon, 100);
  //           color: getColor(neon, 100);
  //           transform: scale(0.8);
  //         }
  //         // display: inline-block;
  //         // width: $spacing / 4;
  //         // height: $spacing / 4;
  //         // background: getColor(gray, 80);
  //         // &:before {
  //         //   content: '';
  //         //   font-family: $font-sans;
  //         //   margin: 0;
  //         // }
  //         // @include tint(color);
  //         // &.light {
  //         //   @include tint(color, 60);
  //         // }
  //         // &.dark {
  //         //   @include tint(color, 40);
  //         // }
  //       }
  //     }
  //   }
  // }

  .group {
    display: flex;
    flex-direction: column;
    // justify-content: center;
    // border-top: 1px solid $color-pale-gray;
    // border-bottom: 1px solid $color-gray;
    width: 100%;
    // align-items: center;

    .group-title {
      // margin: 0;
      width: calc(100% + #{$spacing});

      border-top: 1px solid $color-gray;
      margin: 0 #{-$spacing / 2} 0;
      padding: $spacing / 2 $spacing / 2 0 $spacing / 2;
      // align-self: center;
      // margin-bottom: $spacing / 2;
      // max-width: 600px;
      // margin: 0 $spacing / 4 0;

      &.first-title {
        border-top: none;
      }
      display: flex;
        h3 {
          align-self: center;
          font-weight: $font-weight-bold;
        // margin: $spacing / 4 0;
        // color: $color-neon;
      }
      img {
        // margin: $spacing / 4 $spacing / 4 $spacing / 4 0;
        height: 32px;
        width: auto;
      }
    }

    .panels {
      margin-top: $spacing / 2;
    }
  }

  // .panels {
  //   width: 100%;
  //   max-width: 1920px;
  //   display: flex;
  //   flex-wrap: wrap;
  //   align-items: flex-end;
  //   justify-content: center;
  //   margin: $spacing / 2 0 0;

  //   .chart-line, .chart-stacked-bars {
  //     width: 100%;
  //     // height: 200px;
  //     padding: 0 $spacing / 4;

  //     @include min-width(400px) {
  //       width: calc(50%);
  //     }
  //     @include min-width(700px) {
  //       width: calc(33.33%);
  //     }
  //     @include min-width(1000px) {
  //       width: calc(25%);
  //     }
  //     @include min-width(1300px) {
  //       width: calc(20%);
  //     }
  //     @include min-width(1600px) {
  //       width: calc(16.666%);
  //     }
  //   }
  // }

  .links {
    margin-top: $spacing / 2;
    > * {
      grid-column-start: 1;
      grid-column-end: 4;
      width: 100%;
    }
    @include min-width(720px) {
      .workspace {
        grid-column-start: 2;
        grid-column-end: 4;
        align-self: end;
      }
      .download {
        grid-column-start: 1;
        grid-column-end: 2;
      }
    }
  }

  .meta, .more {
     > * {
      grid-column-start: 1;
      grid-column-end: 4;
      width: 100%;
    }
  }

  .metadata {
    width: 100%;
    // max-width: 600px;
    margin-bottom: $spacing;

     table {
      width: 100%;
      // margin: 0 -$spacing / 6;

      thead th {
        font-weight: $font-weight-bold;
        padding: $spacing / 1.5 $spacing / 3 $spacing / 4 0;
        border-bottom: 1px solid getColor(gray, 70);
         margin-top: $spacing / 3;
      }

      tbody td {
        border-bottom: 1px solid getColor(gray, 80);
        padding: $spacing / 12 $spacing / 3 $spacing / 12 0;
        vertical-align: initial;

        &.bold {
          font-weight: $font-weight-bold;
        }

        ::v-deep {
          h1, h2, h3 {
            font-size: 1em;
          }
        }
      }
    }
  }
  .related, .workspace, .download {
    width: 100%;
    // max-width: 600px;
    // margin-bottom: $spacing;

    ul {
      margin-top: $spacing / 8;
      border-radius: $border-radius;
      &.border {
        border: 1px solid $color-pale-gray;
      }

      .link {
        li {
          padding: $spacing / 4 $spacing / 2;
          list-style: none;
          border-bottom: 1px solid $color-pale-gray;
          transition: background-color $transition;
          &:hover {
            background-color: getColor(gray, 90)
          }

          &.invert {
            background-color: $color-neon;
            border-radius: $border-radius;
            &:hover {
              background-color: getColor(neon, 40)
            }
          }
        }
        &:last-child {
          li {
            border-bottom: none;
          }
        }
        &.invert {
          li {
            background-color: $color-neon;
            border-radius: $border-radius;
            &:hover {
              background-color: getColor(neon, 40);
              color: $color-white;
            }
          }
        }
      }
    }
  }
  .workspace, .download {
    ul {
      text-align: center;
    }
  }
  .workspace {
    margin: 0;
  }
}
</style>
