<template>
  <div class="home">
    <ul>
      <li v-for="gem in gems" :key="gem"><router-link :to="gem">{{ gem }}</router-link></li>
    </ul>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  name: 'home',
  components: {
  },
  computed: {
    ...mapState(['gems'])
  },
  methods: {
    ...mapActions(['fetchGems'])
  },
  created () {
    this.fetchGems()
  }
}
</script>
<style lang="scss" scoped>
@import "library/src/style/global.scss";
.home {
  padding: 0 $spacing / 2;
  li {
    list-style: none;
  }
}
</style>
