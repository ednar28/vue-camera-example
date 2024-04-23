<script setup lang="ts">
  import { useIntervalFn } from '@vueuse/core'
  import RecordRTC from 'recordrtc'
  import { computed, ref, watch } from 'vue'

  const SUPPORTS_MEDIA_DEVICES = 'mediaDevices' in navigator

  const emit = defineEmits<{
    (e: 'photo', data: string): void
    (e: 'video', data: string): void
  }>()

  if (!SUPPORTS_MEDIA_DEVICES) {
    console.log('Your browser does not support to access media devices')
  }

  const facingMode = ref<'environment' | 'user'>('environment')
  const lightMode = ref(false)
  const cameraType = ref<'photo' | 'video'>('photo')

  const constraints = computed(() => {
    // Prefer camera resolution nearest to 1280x720.
    return {
      audio: false,
      video: {
        width: 1280,
        height: 720,
        facingMode: facingMode.value,
      },
    }
  })

  watch(constraints, async () => {
    await stopCamera()
    setCamera()
  })

  watch(lightMode, () => {
    applyLight()
  })

  const stopCamera = async () => {
    const video = document.getElementById('preview-camera') as HTMLVideoElement
    const tracks = video.srcObject as MediaStream
    tracks.getTracks().forEach((t) => t.stop())
  }

  const applyLight = () => {
    const video = document.getElementById('preview-camera') as HTMLVideoElement
    const tracks = video.srcObject as MediaStream
    const track = tracks.getTracks()[0]
    track.applyConstraints({
      // @ts-ignore-next-line
      advanced: [{ torch: lightMode.value }],
    })
  }

  const setCamera = () => {
    navigator.mediaDevices
      .getUserMedia(constraints.value)
      .then((mediaStream) => {
        const video = document.getElementById('preview-camera') as HTMLVideoElement
        const track = mediaStream.getTracks()[0]
        track.applyConstraints({
          // @ts-ignore-next-line
          advanced: [{ torch: lightMode.value }],
        })
        video.srcObject = mediaStream
        video.onloadedmetadata = () => {
          video.play()
        }
      })
      .catch((err) => {
        // always check for errors at the end.
        console.error(`${err.name}: ${err.message}`)
      })
  }

  const takePhoto = () => {
    seconds.value = undefined
    const video = document.getElementById('preview-camera') as HTMLVideoElement

    const canvas = document.getElementById('canvas-camera') as HTMLCanvasElement
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    context.drawImage(video, 0, 0)

    const data = canvas.toDataURL('image/png')
    emit('photo', data)
  }

  const recorder = ref<RecordRTC>()
  const isRecording = ref(false)

  const startVideo = () => {
    isRecording.value = true
    const video = document.getElementById('preview-camera') as HTMLVideoElement
    const tracks = video.srcObject as MediaStream
    recorder.value = new RecordRTC(tracks, {
      type: 'video',
      mimeType: 'video/webm',
    })
    recorder.value.startRecording()
  }
  const stopVideo = () => {
    seconds.value = undefined
    isRecording.value = false
    recorder.value?.stopRecording(() => {
      if (recorder.value === undefined) {
        return
      }
      const blob = recorder.value.getBlob()
      const url = URL.createObjectURL(blob)
      emit('video', url)
      recorder.value.destroy()
    })
  }

  const seconds = ref<number>()
  watch(seconds, () => {
    if (typeof seconds.value === 'number' && seconds.value > 1 && !isRecording.value) {
      startVideo()
    }
  })

  const take = () => {
    if (!(typeof seconds.value === 'number')) {
      seconds.value = 0
      useIntervalFn(() => {
        if (typeof seconds.value === 'number') {
          seconds.value++
          return true
        }
        return false
      }, 100)
      return
    }

    if (seconds.value <= 1) {
      takePhoto()
      return
    }

    stopVideo()
  }

  setCamera()
</script>

<template>
  <div class="fixed inset-0 bg-black">
    <canvas
      class="hidden"
      id="canvas-camera"
    ></canvas>
    <div class="flex flex-col h-full">
      <div
        style="height: 88%"
        class="relative"
      >
        <video
          id="preview-camera"
          autoplay
          playsinline
          class="object-contain h-full w-full"
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
                @touchstart="take"
                @touchend="take"
              >
                <span class="w-16 h-16 text-white icon-[material-symbols--camera]"></span>
              </button>
            </template>
            <template v-else>
              <button
                v-if="isRecording"
                @click="stopVideo"
              >
                <span class="w-16 h-16 text-red-500 icon-[ph--record-fill]"></span>
              </button>
              <button
                v-else
                @click="startVideo"
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
            v-if="isRecording"
          >
            Sedang merekam
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped></style>
