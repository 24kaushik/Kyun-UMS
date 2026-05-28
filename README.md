# Kyun-UMS

Kyun-UMS is a Chrome extension that reads the captcha on QUMS and fills it in for you.

## Why it exists

Filling in captchas was so annoying. We students open the ERP like 20 times a day and filling the captcha wrong just makes me too much frustrated. So I built this extension Kyun-UMS for QUMS. Because filling captchas should be easier. Security of the website, protections from bots? Bro what is a bot even gonna do logging into this ancient ERP where anything barely works and you have to see 2 error alerts just after login. Crashes just before assignments etc. Ain't no bot who wants to crack the captcha to get into this website 😭. That's why the name Kyun-UMS.

## Features

- Auto-detects the QUMS captcha image.
- Runs OCR in the browser.
- Fills the captcha input automatically.
- One-click on/off toggle in the popup.

## Requirements

- Google Chrome (or any Chromium-based browser).
- Node.js and pnpm to build the extension locally.

## Install (build from source)

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the extension:

   ```bash
   pnpm build
   ```

3. Open Chrome and go to `chrome://extensions`.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked**.
6. Select the build output folder: `build/chrome-mv3-prod`.
7. Pin the extension if you want quick access.

## Use it

1. Open the QUMS login page.
2. Click the extension icon.
3. Press **Turn On** to enable autofill.
4. The captcha field will be filled when the image appears.

You can turn it off any time using the same button.

## How it works

- The extension runs only on `https://qums.quantumuniversity.edu.in/`.
- It watches the captcha image for changes.
- When a new captcha appears, it converts it to a higher-contrast image and runs OCR.
- The recognized text is placed into the captcha input field.

## Privacy

- Everything runs locally in your browser.
- No captcha data is sent to any server.

## Troubleshooting

- If nothing happens, refresh the page and toggle **Turn On** again.
- If the captcha is wrong, reload the captcha image and try again.
- After updates, go to `chrome://extensions` and click **Reload** on the extension.

## Development

Start the dev build with hot reload:

```bash
pnpm dev
```

Load the dev build from `build/chrome-mv3-dev` in `chrome://extensions`.

## Contributing

Contributions are welcome. If you want to improve the OCR, UI, or stability:

1. Fork the repo.
2. Create a feature branch.
3. Make your changes.
4. Open a pull request with a clear description and screenshots when relevant.

## License

See [LICENSE](LICENSE).

---

<p align="center">Made with love and frustration by Kaushik Sarkar ❤️</p>
