<template>
  <div class="gem">
    <MdParser :md="text" class="intro"/>
    <div class="options" v-if="config != null">
      <div class="option">
        <div class="tiny label">Choose View</div>
        <SensesSelect :options="configs.map(c => c.name)" v-model="name"/>
      </div>
      <!-- <div class="option">
        <div class="tiny label">{{ config.option2.dimension }}</div>
        <SensesSelect width="200px" :options="config.option2.options" v-model="option2"/>
      </div> -->
    </div>
    <div class="legend" v-if="config != null">
      <div class="tiny label">{{ config.within }}</div>
      <span v-for="(o, i) in config[config.within]" :key="`o${i}`"
        class="tiny" :class="{ transparent: highlight != null && highlight != (o.label || o) }"
        @mouseenter="highlight = o.label || o" @mousemove="highlight = o.label || o" @mouseout="highlight = null">
        <span class="glyph-dot" :class="[colors[i%6], config[config.within].length > 6 ? i >= 6 ? 'light' : 'dark' : null]"/>
        {{ o.label || o }}
      </span>
    </div>
    <div class="panels">
      <ChartLine v-for="(p, i) in data" :key="i" :colors="colors" v-bind="p"
        :number-format="config.numberFormat" :highlight="highlight"/>
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
                <td>{{d.name}}</td>
                <td v-html="d.description"></td>
              </tr>
            </tbody>
          </template>
        </template>
      </table>
    </div>
  </div>
</template>
<script>
import SensesSelect from 'library/src/components/SensesSelect.vue'
import MdParser from '@/components/MdParser.vue'
import ChartLine from '@/components/ChartLine.vue'
import { mapActions, mapState, mapGetters } from 'vuex'
import bindState from '@/assets/js/bindState'
export default {
  name: 'Gem',
  data () {
    return {
      highlight: null
      // meta: [{
      //   name: 'blabla',
      //   description: 'nfjaegnrj;bn dhb arhabgka jrabnjkfvbja;aw cekj v'
      // }, {
      //   name: 'blabla',
      //   description: 'nfjaegnrj;bn dhb arhabgka jrabnjkfvbja;aw cekj v'
      // }]
    }
  },
  components: {
    MdParser,
    ChartLine,
    SensesSelect
  },
  computed: {
    ...mapState(['text', 'configs', 'colors', 'data', 'metadata']),
    ...mapGetters(['config']),
    ...bindState(['name']),
    docs () {
      const { metadata } = this
      if (metadata == null) return null
      // console.log(metadata)
      const meta = metadata.map(m => {
        // const descr = m.description.match(/<\/h1>\s<p>([^<]+)<\/p>/)
        const descr = m.description.match(/<\/h1>\s(.+)/)
        return {
          category: m.key.match(/^\/([^/]+)/)[1],
          description: descr ? descr[1] : null,
          name: m.description.match(/^<h1>([^<]+)<\/h1>/)[1]
        }
      })
      const models = meta.filter(m => m.category === 'models')
      const scenarios = meta.filter(m => m.category === 'scenarios')
      const regions = meta.filter(m => m.category === 'regions')
      // // console.log(models)
      // const scenarios = meta.filter(m => m.key.match(/^\/scenarios/))
      // // console.log(scenarios)
      // const regions = meta.filter(m => m.key.match(/^\/regions/))
      // console.log(regions)
      return [{
        name: 'Model',
        items: models
      }, {
        name: 'Scenario',
        items: scenarios
      }, {
        name: 'Region',
        items: regions
      }]
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
  padding: $spacing;

  .intro {
    width: 100%;
    max-width: 600px;
    margin-bottom: $spacing;
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
      }
      &:last-of-type {
        margin-right: 0;
      }
    }
  }

  .legend {
    width: 100%;
    max-width: 600px;
    margin-top: $spacing / 8;
    .label {
      text-transform: capitalize;
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
    }
  }

  .panels {
    width: 100%;
    max-width: 1080px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    margin: $spacing / 2 0 0;
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
}
</style>
