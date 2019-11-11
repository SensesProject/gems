<template>
  <div class="gem">
    <MdParser :md="text" class="intro"/>
    <div class="options" v-if="config != null">
      <div class="option">
        <div class="tiny label">{{ config.option1.dimension }}</div>
        <SensesSelect width="200px" :options="config.option1.options" v-model="option1"/>
      </div>
      <div class="option">
        <div class="tiny label">{{ config.option2.dimension }}</div>
        <SensesSelect width="200px" :options="config.option2.options" v-model="option2"/>
      </div>
    </div>
    <div class="legend" v-if="config != null">
      <div class="tiny label">{{ config.categories.dimension }}s</div>
      <span v-for="(o, i) in config.categories.options" :key="`o${i}`" class="highlight no-hover" :class="colors[i]">
        {{ o }}
      </span>
    </div>
    <div class="panels">
      <GemPanel v-for="(p, i) in panels" :key="i" :colors="colors" v-bind="p"/>
    </div>
  </div>
</template>
<script>
import SensesSelect from 'library/src/components/SensesSelect.vue'
import MdParser from '@/components/MdParser.vue'
import GemPanel from '@/components/GemPanel.vue'
import { mapActions, mapState, mapGetters } from 'vuex'
import bindState from '@/assets/js/bindState'
export default {
  name: 'Gem',
  components: {
    MdParser,
    GemPanel,
    SensesSelect
  },
  computed: {
    ...mapState(['text', 'config', 'colors']),
    ...mapGetters(['panels']),
    ...bindState(['option1', 'option2'])
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
    span {
      margin-right: $spacing / 4;
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
}
</style>
