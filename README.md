# 🐱 Mantu Apology Website

A funny, cute, and interactive apology experience — made with ❤️ by Wajid, for Mantu.

---

## 🚀 Live Preview (GitHub Pages)

After deploying, your link will look like:
```
https://YOUR_GITHUB_USERNAME.github.io/mantu-apology/
```

---

## 📁 Project Structure

```
mantu-apology/
├── index.html       ← All screens & HTML structure
├── style.css        ← Pastel glassmorphism design system
├── script.js        ← State machine, questions, modals, sound engine
├── README.md        ← This file
└── assets/
    ├── cats/        ← (Optional) custom cat images/GIFs
    ├── images/      ← (Optional) stickers & badges
    └── sounds/      ← (Optional) custom .mp3/.wav audio files
```

---

## 💻 Run Locally

### Option A — Python (quickest)
```bash
cd mantu-apology
python -m http.server 8080
```
Then open: [http://localhost:8080](http://localhost:8080)

### Option B — Node.js `serve`
```bash
npx -y serve .
```
Then open the URL shown in the terminal.

### Option C — VS Code
Install the **Live Server** extension, right-click `index.html` → **Open with Live Server**.

---

## ☁️ Deploy to GitHub Pages (Free Hosting)

### Step 1 — Create a GitHub repo
1. Go to [github.com/new](https://github.com/new)
2. Name it: `mantu-apology`
3. Set to **Public**
4. Click **Create repository**

### Step 2 — Upload your files
```bash
git init
git add .
git commit -m "🐱 Mantu apology website — initial release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mantu-apology.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / folder: **/ (root)**
4. Click **Save**

✅ Your website will be live in ~1 minute at:
```
https://YOUR_USERNAME.github.io/mantu-apology/
```

---

## ✏️ Customizations

### Change Instagram handle
Open `script.js` and update line 10:
```js
const CONFIG = {
  instagramHandle: 'wajidarts',        // ← change this
  instagramUrl:    'https://www.instagram.com/wajidarts',  // ← and this
};
```

### Add custom sounds
1. Place `.mp3` / `.wav` files in `assets/sounds/`
2. In `script.js`, update the `playBoing()` / `playPop()` functions to use `new Audio('assets/sounds/your-file.mp3').play()`

### Add Firebase (optional)
Uncomment the Firebase block at the bottom of `script.js` and fill in your project config to save Mantu's answers to Firestore.

---

## 🎮 Website Flow

```
Landing → Apology → Court (Case #001) → Lie Detector
→ 10 Questions (each with 2-stage modal intermission)
→ Mood Fresh Videos → Goodbye Sequence → Instagram Finale
```

### Question Modal Flow (strictly user-controlled):
```
Pick answer → [Stage 1] Answer Popup → click ✕ → 🔊 BOING
→ [Stage 2] Cat Intermission → click ✕ → 🔊 BOING → Next Question
```

---

## 🔒 Privacy Note

This website collects **zero personal data** by default. No IP, no location, no tracking.

If Firebase is added, only voluntarily submitted question answers (anonymous) are stored.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic structure, all screens |
| CSS3 | Glassmorphism design, animations, responsive |
| JavaScript (ES2022) | State machine, audio, modals, confetti |
| Web Audio API | Built-in sound effects (no external files needed) |
| Google Fonts | Fredoka, Outfit, Quicksand |
| YouTube Links | Mood Fresh therapy videos |
| GitHub Pages | Free hosting |

---

Made with 😂 & 🥹 by Wajid for Mantu.
