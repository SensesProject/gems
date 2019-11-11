export default function (props) {
  const obj = {}
  props.forEach(key => {
    obj[key] = {
      get () {
        return this.$store.state[key]
      },
      set (value) {
        this.$store.dispatch('update', { value, key })
      }
    }
  })
  return obj
}
