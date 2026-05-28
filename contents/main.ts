/// <reference types="chrome" />
import type { PlasmoCSConfig } from "plasmo"
import { createWorker } from "tesseract.js"

export const config: PlasmoCSConfig = {
  matches: ["https://qums.quantumuniversity.edu.in/"]
}

const CAPTCHA_SELECTOR = "#imgPhoto"
const INPUT_SELECTOR = "#captcha"
const EMPTY_CAPTCHA =
  "https://qums.quantumuniversity.edu.in/img/whitey.jpg"
const STORAGE_KEY = "extensionEnabled"

let worker: any = null
let observer: MutationObserver | null = null
let intervalId: number | null = null
let isEnabled = true
const storage = chrome?.storage?.local

async function initWorker() {
  if (worker) return worker

  worker = await createWorker("eng")

  await worker.setParameters({
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",

    tessedit_pageseg_mode: "7"
  })

  return worker
}

async function preprocessBase64Image(
  base64: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      )

      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.299 * data[i] +
          0.587 * data[i + 1] +
          0.114 * data[i + 2]

        const value = gray > 128 ? 255 : 0

        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
      }

      ctx.putImageData(imageData, 0, 0)

      resolve(canvas.toDataURL("image/png"))
    }

    img.src = base64
  })
}

async function handleCaptcha(
  img: HTMLImageElement
) {
  if (!(await refreshEnabledState())) {
    return
  }

  const src = img.src

  if (!src || src === EMPTY_CAPTCHA) {
    return
  }

  const isBase64 =
    src.startsWith("data:image/") ||
    src.startsWith(
      "data:application/octet-stream"
    )

  if (!isBase64) {
    return
  }

  const enhancedImage =
    await preprocessBase64Image(src)

  const workerInstance =
    await initWorker()

  const result =
    await workerInstance.recognize(
      enhancedImage
    )

  const text =
    result.data.text.trim()

  const input = document.querySelector(
    INPUT_SELECTOR
  ) as HTMLInputElement | null

  if (input) {
    input.value = text
  }
}

async function setupObserver() {
  if (!(await refreshEnabledState())) {
    return false
  }

  if (observer) {
    return true
  }

  const img = document.querySelector(
    CAPTCHA_SELECTOR
  ) as HTMLImageElement | null

  if (!img) {
    return false
  }

  if (img.src) {
    await handleCaptcha(img)
  }

  observer = new MutationObserver(async () => {
    await handleCaptcha(img)
  })

  observer.observe(img, {
    attributes: true,
    attributeFilter: ["src"]
  })

  return true
}

function stopObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

async function startObserver() {
  if (intervalId || observer) {
    return
  }

  intervalId = window.setInterval(async () => {
    if (!isEnabled) {
      return
    }

    const success = await setupObserver()

    if (success && intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }, 1000)
}

async function readEnabledState(): Promise<boolean> {
  if (!storage) {
    return true
  }

  const stored = await new Promise<Record<string, boolean | undefined>>(
    (resolve) => {
      storage.get(STORAGE_KEY, (result) => resolve(result))
    }
  )
  return stored[STORAGE_KEY] ?? true
}

async function refreshEnabledState(): Promise<boolean> {
  const value = await readEnabledState()
  isEnabled = value
  return value
}

if (location.pathname === "/") {
  readEnabledState().then((value) => {
    isEnabled = value
    if (isEnabled) {
      startObserver()
    }
  })

  chrome?.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName && areaName !== "local") {
      return
    }

    if (!(STORAGE_KEY in changes)) {
      return
    }

    isEnabled = changes[STORAGE_KEY].newValue ?? true

    if (isEnabled) {
      startObserver()
    } else {
      stopObserver()
    }
  })

  chrome?.runtime?.onMessage?.addListener((message) => {
    if (message?.type !== "setEnabled") {
      return
    }

    isEnabled = Boolean(message.enabled)

    if (isEnabled) {
      startObserver()
    } else {
      stopObserver()
    }
  })
}