<template>
  <div class="home">
    <div class="content">
      <h1>{{ module.title }}</h1>
      <br>
      <span class="mono tiny uppercase">Available GEMs</span>
      <ul class="border">
        <router-link v-for="(gem, i) in module.gems" :key="`g-${i}`" class="link" :to="gem.path">
          <li>{{ gem.title || gem.id }}</li>
        </router-link>
      </ul>
      <br>
      <template v-if="module.link != null">
        <span class="mono tiny uppercase">More on that topic</span>
        <ul>
          <a class="link" :href="module.link">
            <li class="invert">Read the module</li>
          </a>
        </ul>
      </template>
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

    ul {
      margin-top: $spacing / 8;
      border-radius: $border-radius;
      &.border {
        border: 1px solid $color-pale-gray;
      }

      .link {
        li {
          padding: $spacing / 4 $spacing / 2;
          list-style: none;
          border-bottom: 1px solid $color-pale-gray;
          transition: background-color $transition;
          &:hover {
            background-color: getColor(gray, 90)
          }

          &.invert {
            background-color: $color-neon;
            border-radius: $border-radius;
            &:hover {
              background-color: getColor(neon, 40)
            }
          }
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
