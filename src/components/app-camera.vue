<script setup lang="ts">
  import { onBeforeUnmount, onMounted } from 'vue'
  import { useRecordCamera } from './record'

  const emit = defineEmits<{
    (e: 'photo', data: string): void
    (e: 'video', data: string): void
  }>()

  const {
    previewCamera,
    canvasCamera,
    isSupported,
    facingMode,
    lightMode,
    cameraType,
    recordState,
    openCamera,
    closeCamera,
    takePhoto: mediaTakePhoto,
    startRecord,
    stopRecord: mediaStopRecord,
  } = useRecordCamera()

  if (!isSupported.value) {
    console.log('Tidak support kamera')
  }

  const takePhoto = () => {
    const photo = mediaTakePhoto()
    emit('photo', photo)
  }

  const stopRecord = async () => {
    const file = (await mediaStopRecord()) as Blob
    const videoUrl = URL.createObjectURL(file)
    emit('video', videoUrl)
  }

  onMounted(() => {
    openCamera()
  })

  onBeforeUnmount(() => {
    closeCamera()
  })
</script>

<template>
  <div class="fixed inset-0 bg-black">
    <canvas
      class="hidden"
      ref="canvasCamera"
    ></canvas>
    <div class="flex flex-col h-full">
      <div
        style="height: 88%"
        class="relative"
      >
        <video
          ref="previewCamera"
          autoplay
          playsinline
          muted
          class="object-contain h-full w-full"
          :class="{ flip: facingMode === 'user' }"
        >
          Sorry, video element not supported in your browser
        </video>

        <div class="absolute inset-x-0 bottom-0">
          <div class="flex items-center justify-around mb-2">
            <button
              class="block"
              @click="lightMode = !lightMode"
            >
              <span
                v-if="lightMode"
                class="block w-10 h-10 icon-[material-symbols--flash-off] text-white"
              ></span>
              <span
                v-else
                class="block w-10 h-10 icon-[material-symbols--flash-on] text-white"
              ></span>
            </button>

            <template v-if="cameraType === 'photo'">
              <button
                class="block"
                @click="takePhoto"
              >
                <span class="w-16 h-16 text-white icon-[material-symbols--camera]"></span>
              </button>
            </template>
            <template v-else>
              <button
                v-if="recordState === 'recording'"
                @click="stopRecord"
              >
                <span class="w-16 h-16 text-red-500 icon-[ph--record-fill]"></span>
              </button>
              <button
                v-else
                @click="startRecord"
              >
                <span class="w-16 h-16 text-white icon-[ph--record-light]"></span>
              </button>
            </template>

            <button
              v-if="facingMode === 'environment'"
              @click="facingMode = 'user'"
              class="block"
            >
              <span
                class="block w-10 h-10 text-white icon-[material-symbols--flip-camera-android]"
              ></span>
            </button>
            <button
              v-else
              @click="facingMode = 'environment'"
              class="block"
            >
              <span
                class="block w-10 h-10 text-white icon-[material-symbols--flip-camera-android]"
              ></span>
            </button>
          </div>
        </div>

        <div class="py-2">
          <div class="flex items-center justify-center space-x-4 text-white">
            <button
              class="px-4 py-2 block rounded-full"
              :class="{ 'bg-blue-500': cameraType === 'photo' }"
              @click="cameraType = 'photo'"
            >
              Foto
            </button>
            <button
              class="px-4 py-2 block rounded-full"
              :class="{ 'bg-blue-500': cameraType === 'video' }"
              @click="cameraType = 'video'"
            >
              Video
            </button>
          </div>
          <div
            class="mt-2 text-center text-white"
            v-if="recordState === 'recording'"
          >
            Sedang merekam
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
  .flip {
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
  }
</style>
