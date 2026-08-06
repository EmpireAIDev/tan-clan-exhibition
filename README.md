# Tan Clan Exhibition — Family Tree Kiosk

A static, offline webapp (no build step, no server, no CDN). Open `index.html`
directly, or launch it in Chrome kiosk mode for the exhibition laptops.

## Running on exhibition laptops

Launch Chrome pointed at this folder's `index.html` with kiosk mode and
silent printing enabled:

```bash
chrome.exe --kiosk --kiosk-printing "file:///C:/path/to/Tan Clan 3/index.html"
```

- `--kiosk` — fullscreen, no browser chrome, so visitors can't navigate away.
- `--kiosk-printing` — skips the print dialog and prints straight to the
  default printer. Make sure the postcard paper size (Settings ⚙ in the app)
  matches what's loaded in the printer, and that the printer's default paper
  size / scaling is set to "Actual size" (no shrink-to-fit) in Windows so it
  doesn't fight the app's own `@page` sizing.

## Staff settings

Tap the small ⚙ icon in the top-right corner to choose the postcard/paper
size: A6 (148×100mm), 4×6" photo paper, or A5. This is saved in the browser
and applies to the next print.

## Behavior notes

- Data for one visitor is held in `localStorage` only for the trip from the
  preview screen to `print.html`; it's cleared right after printing.
- The kiosk auto-resets to the welcome screen after 3 minutes of no input.
- After printing, it auto-returns to the welcome screen.
- Photos are placeholder circles (first initial) for now — there's a
  reserved `photo` field per person in the data model for real photos later.
