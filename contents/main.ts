import type { PlasmoCSConfig } from "plasmo"
import { createWorker } from "tesseract.js"

export const config: PlasmoCSConfig = {
  matches: ["https://qums.quantumuniversity.edu.in/"]
}

const CAPTCHA_SELECTOR = "#imgPhoto"
const INPUT_SELECTOR = "#captcha"
const EMPTY_CAPTCHA =
  "https://qums.quantumuniversity.edu.in/img/whitey.jpg"

let worker: any = null

console.log("Content script loaded")

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
  const src = img.src

  if (!src || src === EMPTY_CAPTCHA) {
    return
  }

  console.log(src.slice(0, 100))

  const isBase64 =
    src.startsWith("data:image/") ||
    src.startsWith(
      "data:application/octet-stream"
    )

  if (!isBase64) {
    return
  }

  console.log("Captcha detected")

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

  console.log("OCR:", text)

  const input = document.querySelector(
    INPUT_SELECTOR
  ) as HTMLInputElement | null

  if (input) {
    input.value = text
  }
}

async function setupObserver() {
  const img = document.querySelector(
    CAPTCHA_SELECTOR
  ) as HTMLImageElement | null

  if (!img) {
    console.log(
      "Captcha image not found yet"
    )
    return false
  }

  console.log(
    "Captcha image element found"
  )

  if (img.src) {
    await handleCaptcha(img)
  }

  const observer = new MutationObserver(
    async () => {
      console.log("Captcha changed")

      await handleCaptcha(img)
    }
  )

  observer.observe(img, {
    attributes: true,
    attributeFilter: ["src"]
  })

  return true
}

if (location.pathname === "/") {

  const interval = setInterval(async () => {

    const success = await setupObserver()

    if (success) {
      clearInterval(interval)
    }

  }, 1000)
}