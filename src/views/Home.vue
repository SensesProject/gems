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
