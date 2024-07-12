import { useUserMedia } from '@vueuse/core'
import { computed, ref, watch, watchEffect } from 'vue'

export function useRecordCamera() {
  const recorder = ref<MediaRecorder>()
  const cameraType = ref<'video' | 'photo'>('photo')
  const previewCamera = ref<HTMLVideoElement>()
  const canvasCamera = ref<HTMLCanvasElement>()

  const facingMode = ref<'environment' | 'user'>('environment')
  const lightMode = ref(false)

  const constraints = computed(() => {
    return {
      video: {
        facingMode: facingMode.value,
        width: 1280,
        height: 720,
        // @ts-ignore-next-line
        advanced: [{ torch: lightMode.value }],
      },
      audio: true,
    }
  })

  const {
    isSupported,
    stream,
    constraints: userMediaConstraints,
    start,
    stop,
    restart,
  } = useUserMedia({
    constraints: {
      video: {
        facingMode: facingMode.value,
        width: 1280,
        height: 720,
        // @ts-ignore-next-line
        advanced: [{ torch: lightMode.value }],
      },
      audio: true,
    },
  })

  watch(constraints, () => {
    // @ts-ignore-line
    userMediaConstraints.value.video.facingMode = String(
      constraints.value.video.facingMode,
    )
    // @ts-ignore-line
    userMediaConstraints.value.video.advanced = [{ torch: lightMode.value }]

    restart()
  })

  watchEffect(() => {
    if (previewCamera.value) previewCamera.value.srcObject = stream.value!
  })

  // recorder.state somehow is not reactive
  const recordState = ref<'inactive' | 'recording' | 'paused'>('inactive')

  const openCamera = async () => {
    if (stream.value) {
      recorder.value = new MediaRecorder(stream.value, { mimeType: 'video/mp4' })
    }
    await start()
  }
  const closeCamera = () => {
    stop()
  }

  const takePhoto = () => {
    const video = previewCamera.value as HTMLVideoElement
    const canvas = canvasCamera.value as HTMLCanvasElement
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    context.drawImage(video, 0, 0)
    closeCamera()
    return canvas.toDataURL()
  }

  const startRecord = () => {
    if (!stream.value) {
      return
    }

    recorder.value = new MediaRecorder(stream.value, { mimeType: 'video/mp4' })
    recorder.value.start()
    recordState.value = 'recording'
  }

  const stopRecord = () => {
    return new Promise<Blob | undefined>((resolve) => {
      if (!recorder.value) return
      const video = [] as Blob[]

      recordState.value = 'inactive'

      recorder.value.ondataavailable = (e) => {
        video.push(e.data)
      }

      recorder.value.onstop = () => {
        const videoBlob = new Blob(video, { type: 'video/mp4' })
        resolve(videoBlob)
      }

      recorder.value?.stop()
      closeCamera()
    })
  }

  const pauseRecord = () => {
    recordState.value = 'paused'
    recorder.value?.pause()
  }

  const resumeRecord = () => {
    recordState.value = 'recording'
    recorder.value?.resume()
  }

  return {
    facingMode,
    lightMode,
    previewCamera,
    canvasCamera,
    cameraType,
    isSupported,
    recordState,
    openCamera,
    closeCamera,
    takePhoto,
    startRecord,
    stopRecord,
    pauseRecord,
    resumeRecord,
  }
}
