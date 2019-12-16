<template>
  <div class="chart-line" v-resize:debounce.initial="onResize">
    <svg :width="width" :height="height"
      @mousemove="setYear($event)" @mouseenter="setYear($event)" @mouseout="resetYear()">
      <g class="axes">
        <g class="axis-y" :transform="`translate(${padding[3]}, 0)`">
          <g class="ticks ticks-y">
            <g class="tick tick-y" v-for="(t, i) in yTicks" :key="`y${i}`" :transform="`translate(0, ${t.y})`">
              <line :x2="width" :class="{ zero: t.value === 0 }"/>
            </g>
          </g>
          <g class="ruler" v-if="ruler" :transform="`translate(${ruler.x}, ${padding[0]})`">
            <line class="ruler" :y2="height - padding[0] - padding[2]" />
          </g>
        </g>
      </g>
      <g class="title">
        <text y="16">{{ name }}</text>
      </g>
      <g class="lines">
        <polyline v-for="(l, i) in lines" :key="`l${i}`" :class="[l.color, l.shade, { transparent: highlight != null && highlight != l.name }]" :points="l.points"/>
      </g>
      <g class="points">
        <g v-for="(p, i) in points" :key="`p${i}`"  :transform="`translate(${ruler.x}, 0)`">
          <polyline class="shadow" :points="ruler.x < width / 2 ? `0 ${p.y} 4 ${p.y} 8 ${p.y2} 12 ${p.y2}` : `0 ${p.y} -4 ${p.y} -8 ${p.y2} -12 ${p.y2}`"/>
          <polyline :class="[p.color, p.shade]" :points="ruler.x < width / 2 ? `0 ${p.y} 4 ${p.y} 8 ${p.y2} 12 ${p.y2}` : `0 ${p.y} -4 ${p.y} -8 ${p.y2} -12 ${p.y2}`"/>
          <circle :class="[p.color, p.shade]" r="2" :transform="`translate(0, ${p.y})`"/>
          <g :transform="`translate(0, ${p.y2})`">
            <text y="4" :x="ruler.x < width / 2 ? 14 : -14" :style="{ 'text-anchor': ruler.x < width / 2 ? 'start' : 'end'}" class="shadow">{{ p.label }}</text>
            <text y="4" :x="ruler.x < width / 2 ? 14 : -14" :style="{ 'text-anchor': ruler.x < width / 2 ? 'start' : 'end'}" :class="[p.color, p.shade]">{{ p.label }}</text>
          </g>
        </g>
      </g>
      <g class="axes">
        <g class="axis-x" :transform="`translate(0, ${height - padding[2]})`">
          <g class="ticks ticks-x">
            <g class="tick tick-x" v-for="(t, i) in xTicks" :key="`x${i}`" :transform="`translate(${t.x}, 0)`">
              <text :y="tickSize" :class="{transparent: ruler !== null && Math.abs(ruler.x - t.x) < 60}">
                {{ t.value }}
              </text>
            </g>
          </g>
          <g class="ruler" v-if="ruler" :transform="`translate(${ruler.x}, 0)`">
            <text :y="tickSize" :style="{ 'text-anchor': ruler.x === 0 ? 'start' : ruler.x === width ? 'end' : 'middle'}">{{ year }}</text>
          </g>
        </g>
        <g class="axis-y" :transform="`translate(${padding[3]}, 0)`">
          <g class="ticks ticks-y" :class="{transparent: ruler !== null && ruler.x < 60}">
            <g class="tick tick-y" v-for="(t, i) in yTicks" :key="`y${i}`" :transform="`translate(0, ${t.y})`">
              <text y="-4" class="shadow">{{ t.label }}<tspan v-if="i === 0"> {{ unit }}</tspan></text>
              <text y="-4">{{ t.label }}<tspan v-if="i === 0"> {{ unit }}</tspan></text>
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
import { format } from 'd3-format'
export default {
  name: 'ChartLine',
  directives: {
    resize
  },
  props: {
    within: Array,
    name: [String, Object],
    colors: Array,
    numberFormat: {
      default: ',.0f',
      type: String
    },
    highlight: String
  },
  data () {
    return {
      width: null,
      height: 300,
      padding: [38, 0, 16, 0],
      tickSize: 16,
      year: null
    }
  },
  computed: {
    years () {
      const years = this.within.map(c => c.series.map(s => s.year)).flat()
      return years.filter(function (item, index) {
        return years.indexOf(item) >= index
      })
    },
    xDomain () {
      const { years } = this
      const min = Math.min(...years)
      const max = Math.max(...years)
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
        .nice(3)
    },
    xTicks () {
      const { xScale, xDomain } = this
      return xDomain.map(t => ({
        value: t,
        x: xScale(t)
      }))
    },
    yTicks () {
      const { yScale, numberFormat } = this
      return yScale.ticks(3).map(t => ({
        value: t,
        label: format(numberFormat)(t).replace(/,/, ' '),
        y: yScale(t)
      }))
    },
    lines () {
      const { within, xScale, yScale, colors } = this
      return within.map((c, i) => {
        return {
          ...c,
          color: colors[i % 6],
          shade: within.length > 6 ? i >= 6 ? 'light' : 'dark' : null,
          points: c.series.map(d => `${xScale(d.year)}, ${yScale(d.value)}`).join(' '),
          name: c.name
        }
      })
    },
    ruler () {
      const { year, xScale } = this
      if (year === null) return null

      return {
        x: xScale(year)
      }
    },
    points () {
      const { year, within, yScale, colors, numberFormat, height, padding } = this
      if (year === null) return null
      const points = within.map((c, i) => {
        const d = c.series.find(v => v.year === year)
        if (d == null) return null
        const y = yScale(d.value)
        return {
          label: format(numberFormat)(d.value).replace(/,/, ' '),
          color: colors[i % 6],
          shade: within.length > 6 ? i >= 6 ? 'light' : 'dark' : null,
          y,
          y2: y,
          validPosition: false
        }
      })
        .filter(d => d != null)
        .sort((a, b) => a.y - b.y)

      const positions = points.map(p => p.y2)
      const minDist = 14
      let diffs = positions.filter((y, i) => i > 0).map((y, i) => y - positions[i])
      while (diffs.find(d => d < minDist) != null) {
        diffs.forEach((d, i) => {
          if (d < minDist) {
            positions[i] = positions[i] - Math.max((minDist - d) / 2, 2)
            positions[i + 1] = positions[i + 1] + Math.max((minDist - d) / 2, 2)
            if (positions[i + 1] >= height - padding[2]) {
              positions[i + 1] = height - padding[2]
            }
          }
        })
        diffs = positions.filter((y, i) => i > 0).map((y, i) => y - positions[i])
      }
      points.forEach((p, i) => {
        p.y2 = positions[i]
      })

      return points
    },
    unit () {
      const { within } = this
      return within[0].unit
    }
  },
  mounted () {
  },
  methods: {
    onResize (el) {
      this.date = new Date().getTime()
      this.width = el.getBoundingClientRect().width
    },
    setYear (e) {
      const { xScale, years } = this
      const year = xScale.invert(e.offsetX)
      const closestYear = years.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a))
      this.year = closestYear
    },
    resetYear (e) {
      this.year = null
    }
  }
}
</script>
<style lang="scss" scoped>
@import "library/src/style/global.scss";
.chart-line {
  width: calc(50% - #{$spacing / 2});
  height: 300px;
  // background: $color-neon;
  margin-bottom: $spacing;

  svg {
    overflow: visible;

    * {
      pointer-events: none;
    }
    .background {
      fill: getColor(gray, 90);
    }
    .title {
      font-weight: $font-weight-bold;
    }
    .lines, .points {
      polyline {
        fill: none;
        stroke: $color-gray;
        stroke-width: 1.5;
        transition: opacity $transition;
        // mix-blend-mode: multiply;

        @include tint(stroke);
        &.light {
          @include tint(stroke, 60);
        }
        &.dark {
          @include tint(stroke, 40);
        }
        &.shadow {
          stroke-width: 3.5;
          stroke: $color-white;
        }
        &.transparent {
          opacity: 0.1;
        }
      }
    }
    .points {
      circle {
        fill: $color-white;
        // stroke: $color-gray;
        stroke-width: 1.5;
        // mix-blend-mode: multiply;

        @include tint(stroke);

        &.light {
          @include tint(stroke, 60);
        }
        &.dark {
          @include tint(stroke, 40);
        }
      }
      text {
        fill: $color-deep-gray;
        // @include tint(fill);
        // &.light {
        //   @include tint(fill, 60);
        // }
        // &.dark {
        //   @include tint(fill, 40);
        // }
        // font-size: 0.7em;

        &.shadow {
          fill: $color-white;
          stroke: transparentize($color: $color-white, $amount: .2);
          stroke-width: 3px;
        }
      }
    }
    .axes {
      line {
        stroke: $color-pale-gray;

        &.zero {
          stroke: $color-dark-gray;
        }
      }
      .ticks, .ruler {
        transition: opacity $transition;
        text {
          fill: $color-deep-gray;
          transition: opacity $transition;

          &.shadow {
            fill: $color-white;
            stroke: transparentize($color: $color-white, $amount: .2);
            stroke-width: 3px;
          }
          &.transparent {
            opacity: 0.2;
          }
        }
        &.transparent {
          opacity: 0.2;
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
