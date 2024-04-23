<script setup lang="ts">
  import { ref } from 'vue'
  import AppCamera from './components/app-camera.vue'

  const imageUrl = ref('')
  const videoUrl = ref('')
</script>

<template>
  <div class="h-screen">
    <div
      class="w-full h-full"
      v-if="videoUrl"
    >
      <video
        class="w-full h-full object-fill"
        alt="The screen capture will appear in this box."
        controls
      >
        <source
          :src="videoUrl"
          type="video/mp4"
        />
      </video>
    </div>
    <div
      class="w-full h-full"
      v-else-if="imageUrl"
    >
      <img
        class="w-full h-full object-fill"
        :src="imageUrl"
        alt="The screen capture will appear in this box."
      />
    </div>
    <app-camera
      @photo="imageUrl = $event"
      @video="videoUrl = $event"
      v-else
    ></app-camera>
  </div>
</template>

<style lang="postcss" scoped></style>
