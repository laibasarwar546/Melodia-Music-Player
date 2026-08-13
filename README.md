# 🎵 Melodia

A modern, responsive music streaming web application inspired by popular music player interfaces. Melodia allows users to search for songs and artists, play music previews, manage liked songs, view recently played tracks, and switch between dark and light themes.

## ✨ Features

- 🎵 Search songs and artists
- ▶️ Play and pause music
- ⏭️ Automatically play the next song
- ⏮️ Previous song control
- 🔀 Shuffle mode
- 🔁 Repeat mode
- ❤️ Like and unlike songs
- 📚 Liked songs library
- 🕘 Recently played songs
- 🔊 Volume control
- 🔇 Mute/unmute
- 🎚️ Music progress and seeking
- 🌙 Dark and light themes
- 📱 Responsive design
- ⌨️ Keyboard controls
- 🎨 Modern Spotify-inspired interface

## 🛠️ Technologies Used

HTML5 • CSS3 • JavaScript • Apple iTunes Search API • HTML5 Audio API • Local Storage

## 🔌 API

Melodia uses the **Apple iTunes Search API** to search for music and retrieve song information, artwork, and available audio previews. No YouTube API is used, and no API key is required.

## 📂 Project Structure


Melodia
├── index.html
├── style.css
├── script.js
└── README.md
🚀 How to Run
Using VS Code
Download or clone the repository.
Open the Melodia folder in Visual Studio Code.
Make sure index.html, style.css, and script.js are in the same folder.
Install the Live Server extension in VS Code.
Right-click index.html.
Select Open with Live Server.
Melodia will open automatically in your browser.
Using a Browser

You can also open index.html directly in a modern web browser.

Clone from GitHub
git clone https://github.com/laibasarwar546/melodia.git

No backend setup or API key is required.

💾 Local Storage

Melodia uses browser LocalStorage to save liked songs, recently played songs, and the selected theme. These preferences remain available after refreshing the page.

🎧 How It Works

Users search for a song or artist through the search bar. Melodia fetches matching results from the Apple iTunes Search API and displays them as interactive song cards. Selecting a song loads its available preview into the built-in audio player. When a song finishes, the player automatically continues with the next song in the current queue.

👩‍💻 Developer

Laiba Sarwar

GitHub: https://github.com/laibasarwar546

📄 License

This project was created for educational and portfolio purposes.
