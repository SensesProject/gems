<template>
  <div class="gem-panel" v-resize:debounce.initial="onResize">
    <svg :width="width" :height="height">
      <!-- <rect class="background" x="-16" y="-16" :width="width + 32" :height="height + 32"/> -->
      <g class="title">
        <text y="16">{{ name }}</text>
      </g>
      <g class="lines">
        <polyline v-for="(l, i) in lines" :key="`l${i}`" :class="l.color" :points="l.points"/>
      </g>
      <g class="axes">
        <g class="axis-x" :transform="`translate(0, ${height - padding[2]})`">
          <!-- <line :x1="padding" :x2="width"/> -->
          <g class="ticks ticks-x">
            <g class="tick tick-x" v-for="(t, i) in xTicks" :key="`x${i}`" :transform="`translate(${t.x}, 0)`">
              <line :y2="tickSize"/>
              <text :x="i === xTicks.length - 1 ? -2 : 2" :y="tickSize">{{ t.value }}</text>
            </g>
          </g>
        </g>
        <g class="axis-y" :transform="`translate(${padding[3] - tickSize}, 0)`">
          <!-- <line :y1="padding" :y2="height - padding"/> -->
          <g class="ticks ticks-y">
            <g class="tick tick-y" v-for="(t, i) in yTicks" :key="`y${i}`" :transform="`translate(0, ${t.y})`">
              <line :x2="tickSize"/>
              <text y="-4">{{ t.value }}</text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import resize from 'vue-resize-directive'
import { scaleLinear } from 'd3-scale'
export default {
  name: 'GemPanel',
  directives: {
    resize
  },
  props: {
    within: Array,
    name: String,
    colors: Array
  },
  data () {
    return {
      width: null,
      height: 300,
      padding: [24, 0, 16, 16],
      tickSize: 16
    }
  },
  computed: {
    xDomain () {
      const { within } = this
      const min = Math.min(...within.map(c => c.series.map(s => s.year)).flat())
      const max = Math.max(...within.map(c => c.series.map(s => s.year)).flat())
      return [min, max]
    },
    yDomain () {
      const { within } = this
      const min = Math.min(...within.map(c => c.series.map(s => s.value)).flat(), 0)
      const max = Math.max(...within.map(c => c.series.map(s => s.value)).flat())
      return [max, min]
    },
    xScale () {
      const { padding, width, xDomain } = this
      return scaleLinear()
        .domain(xDomain)
        .range([padding[3], width - padding[1]])
        // .nice()
    },
    yScale () {
      const { padding, height, yDomain } = this
      return scaleLinear()
        .domain(yDomain)
        .range([padding[0], height - padding[2]])
        .nice()
    },
    xTicks () {
      const { xScale, xDomain } = this
      return xDomain.map(t => ({
        value: t,
        x: xScale(t)
      }))
    },
    yTicks () {
      const { yScale } = this
      return yScale.ticks(4).map(t => ({
        value: t,
        y: yScale(t)
      }))
    },
    lines () {
      const { within, xScale, yScale, colors } = this
      return within.map((c, i) => {
        return {
          ...c,
          color: colors[i],
          points: c.series.map(d => `${xScale(d.year)}, ${yScale(d.value)}`).join(' ')
        }
      })
    }
  },
  mounted () {
  },
  methods: {
    onResize (el) {
      this.date = new Date().getTime()
      this.width = el.getBoundingClientRect().width
    }
  }
}
</script>
<style lang="scss" scoped>
@import "library/src/style/global.scss";
.gem-panel {
  width: calc(50% - #{$spacing / 2});
  height: 300px;
  // background: $color-neon;
  margin-bottom: $spacing;

  svg {
    overflow: visible;
    .background {
      fill: getColor(gray, 90);
    }
    .title {
      font-weight: $font-weight-bold;
    }
    .lines {
      polyline {
        fill: none;
        stroke: $color-gray;
        stroke-width: 2;
        mix-blend-mode: multiply;

        @include tint(stroke);
      }
    }
    .axes {
      line {
        stroke: $color-light-gray;
      }
      .ticks {
        text {
          fill: $color-gray;
        }
      }
      .ticks-x {
        .tick-x {
          text {
            text-anchor: middle;
          }
          &:first-of-type {
            text {
              text-anchor: start;
            }
          }
          &:last-of-type {
            text {
              text-anchor: end;
            }
          }
        }
      }
    }
  }

  @include max-width(800px) {
    width: 100%;
  }
}
</style>
