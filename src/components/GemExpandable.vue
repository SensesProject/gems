<template>
  <div class="gem-expandable">
    <span class="box">
      <span class="label uppercase" @click="toggleExpand">{{title}}</span>
      <span class="button" :class="{ expanded }" @click="toggleExpand">
        <svg width="17.6" height="17.6" viewBox="-8.8 -8.8 17.6 17.6">
          <line v-for="l in [0, 1, 2, 3]" :key="l" x2="4" y2="4"/>
        </svg>
      </span>
    </span>
    <VueInterpolate :attrs="interpolation" v-slot="{ attrs, active }">
      <div class="slot-outer" :style="{ height: active.style ? `${attrs.style.height}px` : expanded ? 'auto' : 0, opacity: attrs.style.opacity }">
        <div class="slot-inner" ref="slot">
          <slot/>
        </div>
      </div>
    </VueInterpolate>
  </div>
</template>

<script>
import VueInterpolate from './Interpolate'
export default {
  name: 'gem-expandable',
  components: { VueInterpolate },
  props: {
    title: String
  },
  data () {
    return {
      expanded: false,
      outerHeight: 0
    }
  },
  computed: {
    interpolation () {
      return {
        style: {
          value: {
            height: this.outerHeight,
            opacity: this.expanded ? 1 : 0
          },
          duration: 400,
          ease: 'easeQuad'
        }
      }
    }
  },
  methods: {
    toggleExpand () {
      this.expanded = !this.expanded
      const innerHeight = this.$refs.slot.getBoundingClientRect().height
      this.outerHeight = this.expanded ? innerHeight : 0
    }
  }
}
</script>

<style scoped lang="scss">
@import "library/src/style/global.scss";
.gem-expandable {
  .box {
    .button {
      svg {
        display: block;
        line {
          stroke: getColor(neon, 40);
          stroke-width: 1.5px;
          stroke-linecap: square;
          transition: transform $transition, stroke $transition;
          transform: translateX(2px) rotate(90deg);

          &:nth-child(2n) {
            transform: translateX(2px) rotate(180deg);
          }
        }
      }

      &.expanded {
        svg {
          line {
            &:nth-child(1) {
              transform: rotate(90deg);
            }
            &:nth-child(2) {
              transform: rotate(180deg);
            }
            &:nth-child(3) {
              transform: rotate(0);
            }
            &:nth-child(4) {
              transform: rotate(270deg);
            }
          }
        }
      }
    }
    &:hover {
      .button {
        background: getColor(neon, 80);
        svg {
          line {
            stroke: getColor(neon, 20);
          }
        }
      }
    }
    &:active {
      .button {
      background: getColor(neon, 50);
        svg {
          line {
            stroke: $color-white;
          }
        }
      }
    }
  }
  .slot-outer {
    overflow: hidden;

    .slot-inner {
      padding: $spacing / 2 0 0 0;
    }
  }
}
</style>
