<template>
  <div class="home">
    <div class="content tiny">
      <h1>{{ module.title }}</h1>
      <br>
      <div class="box block">
        <span class="label uppercase">Available GEMs</span>
        <ul class="block">
          <router-link v-for="(gem, i) in module.gems" :key="`g-${i}`" class="link button" :to="gem.path">
            <li>{{ gem.title || gem.id }}</li>
          </router-link>
        </ul>
      </div>
      <div class="box block" v-if="module.id != null">
        <span class="label uppercase">More on that topic</span>
        <ul class="block">
          <a class="link button" :href="module.id">
            <li>Read the module</li>
          </a>
        </ul>
      </div>
    </div>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing $spacing / 2;

  .content {
    width: 100%;
    max-width: 600px;
    margin-bottom: $spacing;

    .box {
      width: 100%;
      margin-bottom: $spacing / 2;
    }
    ul {
      width: 100%;
      margin-top: $spacing / 8;
      border-radius: $border-radius;
      text-align: center;
      &.border {
        border: 1px solid $color-pale-gray;
      }
      display: flex;
      flex-direction: column;
      .link {
        width: 100%;
        display: block;
        + .link {
          margin-top: $spacing / 8;
        }
        li {
          font-size: 1em;
          // padding: $spacing / 4 $spacing / 2;
          list-style: none;
          display: block;
          transition: background-color $transition;
        }
        &:last-child {
          li {
            border-bottom: none;
          }
        }
      }
    }
  }
}
</style>
