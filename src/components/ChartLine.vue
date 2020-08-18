<template>
  <div class="chart-line">
    <div class="narrow" v-resize:debounce.initial="onResize">
      <div class="title" :class="{tiny: !large}">{{ label }}</div>
      <svg v-if="runs.length > 0" width="100%" :height="height"
        @mousemove="setYear($event)" @mouseenter="setYear($event)" @mouseout="resetYear()"
        :class="{large}">
        <polygon class="funnel" v-if="param.type === 'funnel'" :points="funnel"/>
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
          <!-- <text y="16">{{ name }}</text> -->
        </g>
        <g class="lines">
          <polyline v-for="(l, i) in lines.filter(l => !l.active)" :key="`l-${param.name}-p-${i}`" :class="[l.color, 'funnel' ]" :points="l.points"/>
          <polyline v-for="(l, i) in lines.filter(l => l.active)" :key="`l-${param.name}-a-${i}`" :class="[l.color]" :points="l.points"/>
        </g>
        <g class="points">
          <g v-for="(p, i) in points" :key="`p${i}`"  :transform="`translate(${ruler.x}, 0)`">
            <polyline class="shadow" :points="ruler.x < width / 2 ? `0 ${p.y} 4 ${p.y} 8 ${p.y2} 12 ${p.y2}` : `0 ${p.y} -4 ${p.y} -8 ${p.y2} -12 ${p.y2}`"/>
            <polyline :class="[p.color]" :points="ruler.x < width / 2 ? `0 ${p.y} 4 ${p.y} 8 ${p.y2} 12 ${p.y2}` : `0 ${p.y} -4 ${p.y} -8 ${p.y2} -12 ${p.y2}`"/>
            <circle :class="[p.color]" r="2" :transform="`translate(0, ${p.y})`"/>
            <g :transform="`translate(0, ${p.y2})`">
              <text y="4" :x="ruler.x < width / 2 ? 14 : -14" :style="{ 'text-anchor': ruler.x < width / 2 ? 'start' : 'end'}" class="shadow">{{ p.label }}</text>
              <text y="4" :x="ruler.x < width / 2 ? 14 : -14" :style="{ 'text-anchor': ruler.x < width / 2 ? 'start' : 'end'}" :class="[p.color]">{{ p.label }}</text>
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
      <div v-else :style="{width: `${width}px`, height: `${height}px`}" class="tiny warn">
        <span>no data available</span>
      </div>
    </div>
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
    runs: Array,
    label: [String, Object],
    colors: Array,
    numberFormat: {
      default: ',.4~r',
      type: String
    },
    highlight: {
      type: Object,
      default () { return {} }
    },
    param: {
      type: Object,
      default () { return {} }
    },
    domain: {
      default: null,
      type: Array
    },
    large: {
      type: Boolean,
      default: false
    },
    height: {
      type: Number,
      default: 200
    }
  },
  data () {
    return {
      width: null,
      padding: [18, 0, 16, 0],
      tickSize: 16,
      year: null
    }
  },
  computed: {
    years () {
      const years = this.runs.map(c => c.series.map(s => s.year)).flat()
      return years.filter(function (item, index) {
        return years.indexOf(item) >= index
      })
    },
    activeYears () {
      const years = this.activeRuns.map(c => c.series.map(s => s.year)).flat()
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
      const { runs, domain } = this
      if (domain != null) return domain
      const min = Math.min(...runs.map(c => c.series.map(s => s.value)).flat(), 0)
      let max = Math.max(...runs.map(c => c.series.map(s => s.value)).flat())
      if (max === min) max += 0.01
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
    passiveRuns () {
      const { runs, highlight, param } = this
      return runs.filter(r => {
        return !highlight[r.params[param.name]]
      })
    },
    activeRuns () {
      const { runs, highlight, param } = this
      return runs.filter(r => {
        return highlight[r.params[param.name]]
      })
    },
    lines () {
      const { runs, xScale, yScale, highlight, param } = this
      return runs.map((c, i) => {
        return {
          ...c,
          active: highlight[c.params[param.name]],
          // color: colors[i % 6],
          // shade: runs.length > 6 ? i >= 6 ? 'light' : 'dark' : null,
          points: c.series.map(d => `${xScale(d.year)}, ${yScale(d.value)}`).join(' ')
          // name: c.primaryDimension
        }
      })
    },
    funnel () {
      const { runs, xScale, yScale } = this
      const funnel = [...runs]
      const years = [...new Set(funnel.map(f => f.series.map(v => v.year)).flat())].sort().map((y, yi, years) => {
        const values = funnel.map(f => {
          let value = f.series.find(v => v.year === y)
          if (value == null) {
            const v1 = f.series.find(v => v.year === years[yi - 1])
            const v2 = f.series.find(v => v.year === years[yi + 1])
            if (v1 != null && v2 != null) {
              value = (v1.value + v2.value) / 2
              return value
            }
          } else {
            return value.value
          }
        }).filter(v => v !== undefined) // .map(v => v.value)
        return {
          min: Math.min(...values),
          max: Math.max(...values),
          year: y
        }
      })
      const lower = years.map(y => `${xScale(y.year)}, ${yScale(y.min)}`).join(' ')
      const upper = years.reverse().map(y => `${xScale(y.year)}, ${yScale(y.max)}`).join(' ')
      return `${lower} ${upper}`
    },
    ruler () {
      const { year, xScale } = this
      if (year === null) return null

      return {
        x: xScale(year)
      }
    },
    points () {
      const { year, activeRuns, yScale, numberFormat, height, padding } = this
      if (year === null) return null
      const points = activeRuns.map((c, i) => {
        const d = c.series.find(v => v.year === year)
        if (d == null) return null
        const y = yScale(d.value)
        return {
          label: format(numberFormat)(d.value).replace(/,/, ' '),
          color: c.color,
          // shade: runs.length > 6 ? i >= 6 ? 'light' : 'dark' : null,
          y,
          y2: y,
          validPosition: false
        }
      }).filter(d => d != null)
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
      const { runs } = this
      return runs[0].unit
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
      const { xScale, activeYears } = this
      if (activeYears.length === 0) return
      const year = xScale.invert(e.offsetX)
      const closestYear = activeYears.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a))
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
  min-width: 0;
  // background: $color-neon;
  margin-bottom: $spacing;
  // display: flex;
  // flex-direction: column;
  // justify-content: flex-end;

  .title {
    font-weight: bold;
    hyphens: auto;
    // overflow: hidden;
    // text-overflow: ellipsis;
    // white-space: nowrap;
  }

  .warn {
    color: getColor(red, 50);
    display: flex;
    justify-content: center;
    align-items: center;
    // border: 1px solid getColor(orange, 100);
    span {
      // background: getColor(red, 100);
      border: 1px solid getColor(red, 50);
      padding: $spacing / 2 $spacing;
    }
  }

  svg {
    overflow: visible;

    &.large text {
      font-size: 1rem;
    }

    * {
      pointer-events: none;
    }
    .background {
      fill: getColor(gray, 90);
    }
    .title {
      font-weight: $font-weight-bold;
    }
    polygon {
      &.funnel {
        fill: getColor(neon, 100);
        opacity: 0.5;
      }
    }
    .lines, .points {
      polyline {
        fill: none;
        stroke: $color-black;
        stroke-width: 1.5;
        transition: opacity $transition;

        @include tint(stroke);
        &.shadow {
          stroke-width: 3.5;
          stroke: $color-white;
        }
        &.transparent {
          opacity: 0.1;
        }
        &.funnel {
          stroke: getColor(neon, 60);
          // mix-blend-mode: multiply;
          stroke-width: 0.5;
          // opacity: 0.2;
        }
        &.reference {
          stroke: $color-black;
          stroke-dasharray: 4 4;
        }
      }
    }
    .points {
      circle {
        fill: $color-white;
        stroke: $color-black;
        stroke-width: 1.5;
        // mix-blend-mode: multiply;

        @include tint(stroke);

        // &.light {
        //   @include tint(stroke, 60);
        // }
        // &.dark {
        //   @include tint(stroke, 40);
        // }
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
}
</style>
