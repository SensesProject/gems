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
</style>
