<template>
  <div class="option-key">
    <span v-if="label" class="tiny">
      {{ label }}&nbsp;
      <span v-if="selectAll && !allSelected" class="reset" @click="reset">
        reset filter
      </span>
    </span>
    <div class="checkboxes">
      <label
        v-for="(o, i) in options"
        :key="`${label}-${i}`"
        class="highlight"
        :class="[{active: value[o.name], passive: hover && o.name != hover, unclicked: !clicked}, o.color]"
        @mouseover="onHover(o.name)"
        @mouseleave="onHover(null)"
        @mouseout="onHover(null)"
        @click="clicked = true">
        <input
          type="checkbox"
          :name="_uid"
          :checked="value[o.name]"
          :value="o.value != null ? o.value : o"
          x-v-model="value[o.name]"
          @change="onChange(o.name)">
          <span>{{ o.label || (o.value != null ? o.value : o) }}</span>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'option-key',
  props: {
    label: {
      type: [String, Number],
      default: ''
    },
    value: {},
    options: {
      type: Array,
      default () {
        return [{
          value: 1,
          label: 'Option 1'
        }, {
          value: 'Option 2'
        }, {
          value: 3,
          label: 'Option 3',
          color: 'green'
        },
        'Long Option 4']
      }
    },
    selectAll: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      hover: null,
      preservedValue: {},
      clicked: false
    }
  },
  computed: {
    allSelected () {
      const value = this.preservedValue
      return Object.keys(value).map(key => value[key]).filter(v => v).length !== 1
    }
  },
  mounted () {
    this.preservedValue = { ...this.value }
  },
  methods: {
    onHover (param) {
      this.hover = param
      this.clicked = false
      if (param != null) {
        const value = { ...this.value }
        this.preservedValue = { ...this.value }
        Object.keys(value).forEach(key => { value[key] = false })
        value[param] = true
        this.$emit('input', value)
      } else {
        this.$emit('input', { ...this.preservedValue })
      }
    },
    onChange (param) {
      const { selectAll, allSelected } = this
      const value = { ...this.preservedValue }
      const paramValue = value[param]
      if (paramValue && selectAll && !allSelected) {
        Object.keys(value).forEach(key => { value[key] = true })
        this.hover = null
      } else {
        Object.keys(value).forEach(key => { value[key] = false })
        value[param] = true
      }
      this.preservedValue = { ...value }
      this.$emit('input', value)
    },
    reset () {
      const value = { ...this.value }
      Object.keys(value).forEach(key => { value[key] = true })
      this.preservedValue = { ...value }
      this.$emit('input', value)
    }
  }
}
</script>

<style scoped lang="scss">
@import "library/src/style/global.scss";
.option-key {
  display: inline-block;

  .reset {
    text-transform: uppercase;
    // color: $color-neon;
    color: getColor(neon, 40);
    padding: $spacing / 8;
    transition: color $transition;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
      color: getColor(neon, 40);
    }
  }

  .checkboxes {
    position: relative;
    width: 100%;
    margin-left: $spacing / -8;
    margin-bottom: $spacing / -8;
    display: flex;
    flex-wrap: wrap;
    label {
      margin-left: $spacing / 8;
      margin-bottom: $spacing / 8;
      // color: getColor(neon, 40);
      min-width: 64px;
      align-items: center;
      justify-content: center;
      transition: background $transition, color $transition;
      &.highlight {
        background: getColor(neon, 100);
        color: getColor(neon, 40);

        // &:hover {
        //   background: getColor(neon, 80);
        //   @include tint(background, 80);
        //   color: getColor(neon, 20);
        //   @include tint(color, 20);
        // }
      }

      &.active, &.active:hover, &.highlight:hover {
        background: $color-yellow;
        @include tint(background, 50);
        color: getColor(gray, 90);

        &.unclicked:hover {
          background: getColor(yellow, 80);
          @include tint(background, 80);
          color: getColor(gray, 90);
          color: getColor(yellow, 40);
          @include tint(color, 40);
        }
      }

      &.active.passive {
        background: getColor(neon, 100);
        color: getColor(neon, 40);
      }

      input {
        opacity: 0;
        appearance: none;
        -webkit-appearance: none;

        &:checked+span {
          // cursor: default;
        }

        +span {
          width: 100%;
          display: inline-block;
          line-height: 1.2;
          padding: $spacing * 0.1 $spacing * 0.25;
          text-align: center;
          cursor: pointer;
        }
      }
    }
  }
}

</style>
