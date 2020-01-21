<template>
  <div id="app">
    <SensesMenu/>
    <router-view/>
  </div>
</template>
<script>
import SensesMenu from 'library/src/components/SensesMenu.vue'
export default {
  components: {
    SensesMenu
  }
}
</script>
<style lang="scss">
@import "library/src/style/base.scss";
</style>
