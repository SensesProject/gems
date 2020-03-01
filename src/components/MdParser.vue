<template>
  <section v-html="parsed"/>
</template>

<script>
import marked from 'marked'
import { sanitize } from 'dompurify'
export default {
  name: 'MdParser',
  props: {
    md: String
  },
  computed: {
    parsed () {
      if (this.md == null) return null
      return sanitize(marked(this.md))
    }
  }
}
</script>
