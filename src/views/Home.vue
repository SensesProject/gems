<template>
  <div class="home">
    <div class="content tiny">
      <h1>{{ collection.title }}</h1>
      <br>
      <div class="box block" v-for="(group, i) in collection.groups" :key="`group-${i}`">
        <span class="label uppercase">{{group.title || 'Available GEMs'}}</span>
        <ul class="block">
          <router-link v-for="(gem, i) in group.gems" :key="`g-${i}`" class="link button" :to="gem.path">
            <li>{{ gem.title || gem.id }}</li>
          </router-link>
        </ul>
      </div>
      <div class="box block" v-if="collection.modules != null && collection.modules.length > 0">
        <span class="label uppercase">Related Learn {{collection.modules.length === 1 ? 'module' : 'modules'}}</span>
        <ul class="block">
          <a class="link button dark" v-for="(m, i) in collection.modules" :key="`m-${i}`" :href="m.link">
            <li>{{m.title}}</li>
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
    collection () {
      const { $route, gems } = this
      const modules = this.modules ? this.modules.modules : []
      const collection = gems.find(g => g.dir === $route.params.module)
      if (collection == null) {
        return {
          title: 'Guided Explore Modules',
          groups: [{
            title: 'All Collections',
            gems: gems.map(({ title, dir }) => ({ title, path: dir }))
          }]
        }
      }
      return {
        ...collection,
        modules: collection.modules.map(m => modules.find(({ id }) => id === m)).filter(m => m != null),
        groups: collection.groups.map(group => ({
          title: group.title,
          gems: group.gems.map(g => ({
            ...g,
            path: `${collection.dir}/${g.id}`
          }))
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
