
import { timer } from 'd3-timer'
import { interpolate } from 'd3-interpolate'
import * as ease from 'd3-ease'

export default {
  name: 'vue-interpolate',
  data () {
    return {
      timers: {},
      interpolatedAttrs: {}
    }
  },
  render (h) {
    const active = Object.fromEntries(Object.keys(this.timers).map(key => [key, this.timers[key]._call !== null]))
    return h(this.tag, this.$scopedSlots.default({
      attrs: this.interpolatedAttrs,
      active
    }))
  },
  props: {
    attrs: {},
    tag: {
      type: String,
      default: 'span'
    }
  },
  watch: {
    attrs: {
      handler (attrs, oldAttrs) {
        if (oldAttrs == null) {
          this.interpolatedAttrs = Object.fromEntries(Object.keys(attrs).map(key => {
            return [key, attrs[key].value]
          }))
          return
        }
        this.timers = Object.fromEntries(Object.keys(attrs).map(key => {
          const attr = { duration: 1000, delay: 0, ease: 'easeLinear', ...attrs[key] }
          let interpolation
          let firstRun = true
          const t = timer((elapsed) => {
            if (firstRun) {
              interpolation = interpolate(this.interpolatedAttrs[key], attrs[key].value)
              firstRun = false
            }
            const progress = elapsed / attr.duration
            this.interpolatedAttrs[key] = interpolation(ease[attr.ease](Math.min(progress, 1)))
            if (elapsed > attr.duration) {
              t.stop()
              this.interpolatedAttrs[key] = attrs[key].final != null ? attrs[key].final : attrs[key].value
            }
          }, attr.delay)
          return [key, t]
        }))
      },
      deep: true,
      immediate: true
    }
  }
}
