<template>
  <div id="app">
    <SensesMenu/>
    <router-view/>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import SensesMenu from 'library/src/components/SensesMenu.vue'
export default {
  components: {
    SensesMenu
  },
  methods: {
    ...mapActions(['fetchGems'])
  },
  created () {
    this.fetchGems()
  }
}
</script>
<style lang="scss">
@import "library/src/style/base.scss";
@font-face {
  font-family: 'gem-view';
  src: url('~@/assets/fonts/gem-view.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}

.center {
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;

  // &.wider {
  //   max-width: 1600px;
  // }
}
#app {
  .box {
    background: transparentize(getColor(gray, 90), .15);
    @supports (
      (-webkit-backdrop-filter: saturate(180%) blur(20px)) or
        (backdrop-filter: saturate(180%) blur(20px))
    ) {
      backdrop-filter: saturate(180%) blur(10px);
      background: transparentize(getColor(neon, 100), .6);
    }

    border-radius: $spacing / 4;
    padding: $spacing / 8;
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;

    .label {
      display: inline-block;
      padding: $spacing / 8 $spacing / 4 $spacing / 8 $spacing / 8;
      cursor: default;
    }

    .button {
      transition: background $transition, color $transition;
      background: getColor(neon, 100);
      color: getColor(neon, 40);
      display: inline-block;
      padding: $spacing / 8;
      border-radius: $spacing / 8;

      &:hover {
        background: getColor(neon, 80);
        color: getColor(neon, 20);
      }
      &.selected, &:active {
        background: getColor(neon, 50);
        color: $color-white;
      }

      &.dark {
        background: getColor(neon,50);
        color: getColor(gray, 90);

        &:hover {
          background: getColor(neon, 40);
          color: getColor(gray, 90);
        }
        &.selected, &:active {
          background: getColor(neon,20);
          color: getColor(neon, 100);
        }
      }
    }
    .senses-radio {
      grid-column-gap: 0;

      .radio {
        grid-column-gap: 0;
        display: flex;
        flex-wrap: wrap;
        margin-bottom: -$spacing / 8;
        label {
          border-radius: $spacing / 8;
          margin: 0 $spacing / 8 $spacing / 8 0;
          padding: 0;

          span {
            padding: $spacing / 8 $spacing / 8;
            line-height: inherit;
          }

          &:last-of-type {
            margin-right: 0;
          }
        }
      }
    }

    .senses-select {
      button {
        border-radius: $spacing / 8;

        span {
          padding: $spacing / 8;
        }
      }
    }

    &.block {
      flex-direction: column;
      align-items: flex-start;

      .senses-radio {
        width: 100%;
        .radio {
          display: grid;
          margin-bottom: 0;
          label {
            border-radius: $spacing / 8;
            margin: $spacing / 8 0 0 0;
            padding: 0;
          }
        }
      }
    }
  }
}
.senses-tooltip .tooltip-inner {
  font-size: 0.8em;
  border-radius: $spacing / 8;
  padding: $spacing / 8;

  .option {
    padding: $spacing / 8;
    border-radius: $spacing / 16;

    + .option {
      margin-top: $spacing / 8;
    }
  }
}
</style>
