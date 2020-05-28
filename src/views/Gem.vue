  <template>
  <div class="gem">
    <template v-if="config && current">
      <section class="intro">
        <h1>{{ config.title }}</h1>
        <MdParser :md="config.description"/>
      </section>
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
            <li>Open workspace in Scenario Explorer ↗</li>
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
      synchronize: true
    }
  },
  components: {
    ChartLine,
    SensesSelect,
    SensesRadio,
    MdParser
  },
  computed: {
    ...mapState(['config', 'colors', 'data', 'metadata', 'current', 'domains', 'gems', 'modules']),
    ...mapGetters(['dict']),
    ...bindState(['options']),
    docs () {
      const { metadata } = this
      return metadata
    },
    groups () {
      const { current, data } = this
      if (current == null || data == null) return
      if (current.groups == null) return [{ data }]
      let start = 0
      return current.groups.map(g => {
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
    'options': { // force update options in state
      handler (o) {
        this.options = o
      },
      deep: true
    }
  }
}
</script>
<style lang="scss" scoped>
@import "library/src/style/global.scss";
.gem {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing $spacing / 2;

  .intro {
    width: 100%;
    max-width: 600px;
    margin-bottom: $spacing;
  }

  .text {
    width: 100%;
    max-width: 600px;
    margin: $spacing / 2 0;
  }

  .options {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    .option {
      margin: 0 $spacing / 4 $spacing / 8 0;
      .label {
        text-transform: capitalize;
        &.axis {
          margin-bottom: -5px;
        }
      }
      &:last-of-type {
        margin-right: 0;
      }
    }
  }

  .legend {
    background: transparentize($color-white, 0.02);
    z-index: 10;
    @supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or(backdrop-filter: saturate(180%) blur(20px))) {
      background: transparentize($color-white, 0.15);
      -webkit-backdrop-filter: saturate(180%) blur(10px);
      backdrop-filter:saturate(180%) blur(10px)
    }
    top: $spacing * 2;
    position: sticky;
    width: 100vw;
    display: flex;
    padding: 0 $spacing / 2 $spacing / 4;
    // align-items: center;
    justify-content: center;
    // padding-bottom: $spacing / 4;
    .legend-inner {
      width: 100%;
      max-width: 600px;
      margin-top: $spacing / 8;
      .label {
        text-transform: capitalize;
        margin-bottom: -$spacing / 16;
      }
      > span {
        margin-right: $spacing / 4;
        display: inline-block;
        cursor: default;
        transition: opacity $transition;

        &.transparent {
          opacity: .6;
        }
          // white-space: nowrap;
        .glyph-dot {
          &:before {
            content: '●';
            font-family: $font-sans;
            margin: 0;
          }
          @include tint(color);
          &.light {
            @include tint(color, 60);
          }
          &.dark {
            @include tint(color, 40);
          }
        }
        .glyph-rect {
          &:before {
            content: '●';
            font-family: $font-sans;
            margin: 0;
            background: getColor(neon, 100);
            color: getColor(neon, 100);
          }
          // display: inline-block;
          // width: $spacing / 4;
          // height: $spacing / 4;
          // background: getColor(gray, 80);
          // &:before {
          //   content: '';
          //   font-family: $font-sans;
          //   margin: 0;
          // }
          // @include tint(color);
          // &.light {
          //   @include tint(color, 60);
          // }
          // &.dark {
          //   @include tint(color, 40);
          // }
        }
      }
    }
  }

  .group {
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-top: 1px solid $color-pale-gray;
    width: 100%;
    align-items: center;

    .group-title {
      width: 100%;
      align-self: center;
      max-width: 600px;
      margin: 0 $spacing / 4 0;
      display: flex;
        h3 {
        align-self: center;
        margin: $spacing / 4 0;
        color: $color-neon;
      }
      img {
        margin: $spacing / 4 $spacing / 4 $spacing / 4 0;
        height: 32px;
        width: auto;
      }
    }
  }

  .panels {
    width: 100%;
    max-width: 1920px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: center;
    margin: $spacing / 2 0 0;

    .chart-line, .chart-stacked-bars {
      width: 100%;
      // height: 200px;
      padding: 0 $spacing / 4;

      @include min-width(400px) {
        width: calc(50%);
      }
      @include min-width(700px) {
        width: calc(33.33%);
      }
      @include min-width(1000px) {
        width: calc(25%);
      }
      @include min-width(1300px) {
        width: calc(20%);
      }
      @include min-width(1600px) {
        width: calc(16.666%);
      }
    }
  }

  .metadata {
    width: 100%;
    max-width: 600px;
    margin-bottom: $spacing;

     table {
      width: 100%;
      margin: 0 -$spacing / 6;

      thead th {
        font-weight: $font-weight-bold;
        padding: $spacing / 1.5 $spacing / 6 $spacing / 4;
        border-bottom: 1px solid getColor(gray, 80);
         margin-top: $spacing / 3;
      }

      tbody td {
        border-bottom: 1px solid getColor(gray, 90);
        padding: $spacing / 12 $spacing / 6 $spacing / 12 $spacing / 6;
      }
    }
  }
  .related, .workspace {
    width: 100%;
    max-width: 600px;
    margin-bottom: $spacing;

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
      }
    }
  }
  .workspace {
    ul {
      text-align: center;
    }
  }
}
</style>
