<template>
  <div class="home">
    <h1>{{ module.title }}</h1>
    <ul>
      <li v-for="(gem, i) in module.gems" :key="`g-${i}`"><router-link :to="gem.path">{{ gem.title || gem.id }}</router-link></li>
    </ul>
    <br>
    <ul v-if="module.link != null">
      <li>More on that topic</li>
      <li><router-link :to="module.link">→ Read the module</router-link></li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'home',
  components: {
  },
  computed: {
    ...mapState(['gems', 'modules']),
    module () {
      const { $route, gems } = this
      const module = gems.find(g => g.dir === $route.params.module)
      if (module == null) {
        return {
          title: 'Guided Explore Modules',
          gems: gems.map(({ title, dir }) => ({ title, path: dir }))
        }
      }
      return {
        ...module,
        gems: module.gems.map(gem => ({
          ...gem,
          path: `${module.dir}/${gem.id}`
        }))
      }
    }
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
