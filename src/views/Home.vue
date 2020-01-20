<template>
  <div class="home">
    <ul>
      <li><router-link to="stocktake-models">stocktake models</router-link></li>
      <li><router-link to="stocktake-models-flipped">stocktake models (alternative)</router-link></li>
      <li><router-link to="stocktake-energy">stocktake energy</router-link></li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'home',
  components: {
  }
}
</script>
