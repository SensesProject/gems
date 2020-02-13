<template>
  <div class="gem">
    <template v-if="config">
      <section class="intro">
        <h1>{{ config.title }}</h1>
        <p>{{ config.description }}</p>
      </section>
      <div class="options" v-if="config != null">
        <div class="option" v-for="(o,i) in config.dropdowns" :key="`o-${i}`">
          <div class="tiny label">{{ o.label }}</div>
          <SensesSelect width="120" :options="o.options.map(c => c.label)" v-model="options[i]"/>
        </div>
      </div>
      <div class="legend" v-if="current != null">
        <div class="tiny label">{{ config.primaryDimension }}</div>
        <span v-for="(o, i) in current[config.primaryDimension]" :key="`o${i}`"
          class="tiny" :class="{ transparent: highlight != null && highlight != o }"
          @mouseenter="highlight = o" @mousemove="highlight = o" @mouseout="highlight = null">
          <span class="glyph-dot" :class="[colors[i]]"/>
          {{ dict[o] || o }}
        </span>
      </div>
      <div class="panels" v-else>
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
                  <td>{{dict[d.name] || d.name}}</td>
                  <td v-html="d.description"></td>
                </tr>
              </tbody>
            </template>
          </template>
        </table>
      </div>
      </template>
  </div>
</template>
<script>
import SensesSelect from 'library/src/components/SensesSelect.vue'
import ChartLine from '@/components/ChartLine.vue'
import { mapActions, mapState, mapGetters } from 'vuex'
import bindState from '@/assets/js/bindState'
export default {
  name: 'Gem',
  data () {
    return {
      highlight: null
    }
  },
  components: {
    ChartLine,
    SensesSelect
  },
  computed: {
    ...mapState(['config', 'colors', 'data', 'metadata', 'current']),
    ...mapGetters(['dict']),
    ...bindState(['options']),
    docs () {
      const { metadata } = this
      return metadata
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
      margin-bottom: -$spacing / 8;
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
    width: 100vw;
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
}
</style>
