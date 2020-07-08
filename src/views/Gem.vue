  <template>
  <div class="gem">
    <template v-if="gem">
      <section class="intro grid">
        <h1>{{ gem.title }}</h1>
        <MdParser :md="gem.description"/>
      </section>
      <section class="config-1 grid tint">
        <div class="question">
          <div class="label tiny"><strong>Guiding Question</strong></div>
          <SensesRadio :isHorizontal="false" :options="questions" v-model="perspective.question"/>
        </div>
        <div class="comparison">
          <div class="label tiny"><strong>Comparison</strong></div>
          <SensesRadio :isHorizontal="false" :options="comparisons" v-model="perspective.comparison"/>
        </div>
      </section>
      <!-- <section class="intro grid">
        <MdParser :md="gem.description"/>
      </section> -->
      <section class="config-2 grid tint">
        <div class="param" v-for="(p, i) in gem.params.filter(p => p.name !== perspective.comparison || p.type === 'funnel')" :key="`p-${i}`">
          <div class="label tiny">{{ p.name }}</div>
          <SensesSelect :options="p.options.map(o => o.name)" v-model="perspective.params[p.name]"/>
        </div>
      </section>
      <section class="key tint">
          <div class="tiny label">{{ perspective.comparison }}</div>
          <div class="cats">
            <span v-for="(cat, i) in cats" :key="`o-${i}`" class="highlight cat" :class="colors[i]">
              {{ cat.name }}
            </span>
          </div>
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
      </section>
      <section class="charts">
        <div class="group " v-for="(g, i) in groups" :key="`g-${i}`">
          <div class="group-title">
            <img v-if="g.img" :src="g.img"/>
            <h3 v-if="g.label">{{g.label}}</h3>
          </div>
          <div class="panels grid">
            <ChartLine v-for="(p, j) in g.data.filter(p => p.runs.length > 0)" :key="`${i}-${j}`" :colors="colors" v-bind="p"
              :number-format="config.numberFormat" :highlight="highlight"
              :domain="synchronize ? domains[p.runs[0].unit] : null"/>
          </div>
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
      <div v-if="config.workspace" class="workspace">
        <ul class="border">
          <a :href="config.workspace" class="link" target="_blank">
            <li>Open workspace in IIASA Scenario Explorer ↗</li>
          </a>
        </ul>
      </div>
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
                  <td>{{dict[d.name] || d.name}}</td>
                  <td v-html="d.description"></td>
                </tr>
              </tbody>
            </template>
          </template>
        </table>
      </div>
      <div v-if="related" class="related">
        <template v-if="related.module.link != null">
          <span class="mono tiny uppercase">More on that topic</span>
          <ul>
            <a class="link" :href="related.module.link">
              <li class="invert">Read the module</li>
            </a>
          </ul>
          <br>
        </template>
        <span class="mono tiny uppercase">Related GEMs</span>
        <ul class="border">
          <router-link v-for="(link, i) in related.gems" :key="`g-${i}`" class="link" :to="link.path">
            <li>{{ link.title }}</li>
          </router-link>
        </ul>
      </div>
    </template>
  </div>
</template>
<script>
import SensesSelect from 'library/src/components/SensesSelect.vue'
import SensesRadio from 'library/src/components/SensesRadio.vue'
import ChartLine from '@/components/ChartLine.vue'
import MdParser from '@/components/MdParser.vue'
import { mapActions, mapState, mapGetters } from 'vuex'
import bindState from '@/assets/js/bindState'
export default {
  name: 'Gem',
  data () {
    return {
      highlight: null,
      synchronize: true,
      question: null,
      comparison: null,
      params: {}
    }
  },
  components: {
    ChartLine,
    SensesSelect,
    SensesRadio,
    MdParser
  },
  computed: {
    ...mapState(['gem', 'config', 'colors', 'data', 'metadata', 'current', 'domains', 'gems', 'modules']),
    ...mapGetters(['dict']),
    ...bindState(['options', 'perspective']),
    questions () {
      const { gem } = this
      return gem.questions.map(p => p.name)
    },
    comparisons () {
      const { gem } = this
      return gem.params.map(p => p.name)
    },
    cats () {
      const { gem, perspective } = this
      const param = gem.params.find(p => p.name === perspective.comparison)
      return param.type === 'funnel' ? [param.options.find(o => o.name === perspective.params[param.name])] : param.options
    },
    docs () {
      const { metadata } = this
      return metadata
    },
    groups () {
      const { config, data } = this
      if (config == null || data == null) return
      if (config.groups == null) return [{ data }]
      let start = 0
      return config.groups.map(g => {
        const d = data.filter((d, i) => i >= start && i < start + g.size)
        start += g.size
        return {
          label: g.label,
          img: g.img,
          data: d
        }
      })
    },
    related () {
      const { $route, gems } = this
      const module = gems.find(g => g.dir === $route.params.module)
      if (module == null) return null
      const relatedGems = module.gems.filter(gem => gem.id !== $route.params.gem).map(gem => ({
        title: gem.title || gem.id,
        path: `/${module.dir}/${gem.id}`
      }))
      return {
        gems: relatedGems,
        module
      }
    }
  },
  methods: {
    ...mapActions(['initGem', 'initSession'])
  },
  created () {
    this.initSession(this.$route.params.gem)
  },
  watch: {
    '$route.params.gem' () {
      this.initGem(this.$route.params.gem)
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

$column: 240px;

.gem {
  padding: $spacing / 2;

  section + section {
    margin-top: $spacing / 2;
  }

  section.tint {
    background: getColor(gray, 90);
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
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    max-width: $column * 7;
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

  ::v-deep .config-2 {
    .senses-select {
      width: 100%;
      > * {
        width: 100%;
        > * {
          width: 100%;
        }
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
    top: $spacing * 2;
    position: sticky;

    .cats {
      margin-left: $spacing / -8;
      margin-bottom: $spacing / -8;
      .cat {
        text-align: center;
        margin-left: $spacing / 8;
        margin-bottom: $spacing / 8;
      }
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

  // .group {
  //   display: flex;
  //   flex-direction: column;
  //   justify-content: center;
  //   border-top: 1px solid $color-pale-gray;
  //   width: 100%;
  //   align-items: center;

  //   .group-title {
  //     width: 100%;
  //     align-self: center;
  //     max-width: 600px;
  //     margin: 0 $spacing / 4 0;
  //     display: flex;
  //       h3 {
  //       align-self: center;
  //       margin: $spacing / 4 0;
  //       color: $color-neon;
  //     }
  //     img {
  //       margin: $spacing / 4 $spacing / 4 $spacing / 4 0;
  //       height: 32px;
  //       width: auto;
  //     }
  //   }
  // }

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

  // .metadata {
  //   width: 100%;
  //   max-width: 600px;
  //   margin-bottom: $spacing;

  //    table {
  //     width: 100%;
  //     margin: 0 -$spacing / 6;

  //     thead th {
  //       font-weight: $font-weight-bold;
  //       padding: $spacing / 1.5 $spacing / 6 $spacing / 4;
  //       border-bottom: 1px solid getColor(gray, 80);
  //        margin-top: $spacing / 3;
  //     }

  //     tbody td {
  //       border-bottom: 1px solid getColor(gray, 90);
  //       padding: $spacing / 12 $spacing / 6 $spacing / 12 $spacing / 6;
  //     }
  //   }
  // }
  // .related, .workspace {
  //   width: 100%;
  //   max-width: 600px;
  //   margin-bottom: $spacing;

  //   ul {
  //     margin-top: $spacing / 8;
  //     border-radius: $border-radius;
  //     &.border {
  //       border: 1px solid $color-pale-gray;
  //     }

  //     .link {
  //       li {
  //         padding: $spacing / 4 $spacing / 2;
  //         list-style: none;
  //         border-bottom: 1px solid $color-pale-gray;
  //         transition: background-color $transition;
  //         &:hover {
  //           background-color: getColor(gray, 90)
  //         }

  //         &.invert {
  //           background-color: $color-neon;
  //           border-radius: $border-radius;
  //           &:hover {
  //             background-color: getColor(neon, 40)
  //           }
  //         }
  //       }
  //       &:last-child {
  //         li {
  //           border-bottom: none;
  //         }
  //       }
  //     }
  //   }
  // }
  // .workspace {
  //   ul {
  //     text-align: center;
  //   }
  // }
}
</style>
