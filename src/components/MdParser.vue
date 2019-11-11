<template>
  <div v-html="parsed"/>
</template>

<script>
import marked from 'marked'
export default {
  name: 'MdParser',
  props: {
    md: String
  },
  computed: {
    parsed () {
      if (this.md == null) return null
      return marked(this.md)
    }
  }
}
</script>
