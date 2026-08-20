# 🎵 Melodia Music Player

A modern, responsive music player web application built with HTML, CSS, and JavaScript. Melodia allows users to search for songs and artists, listen to music previews, manage liked songs, view recently played tracks, and enjoy a clean Spotify-inspired interface.

## 🌐 Live Demo

[🎵 Open Melodia Music Player]https://melodia-music-player-plum.vercel.app/

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
- 🔇 Mute and unmute
- 🎚️ Music progress bar and seeking
- 🌙 Dark and light themes
- 📱 Responsive design
- ⌨️ Keyboard controls
- 🎨 Modern Spotify-inspired interface

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Apple iTunes Search API
- HTML5 Audio API
- LocalStorage

## 🔌 API

Melodia uses the **Apple iTunes Search API** to search for music and retrieve:

- Song information
- Artist information
- Album artwork
- Audio previews

No YouTube API is used, and no API key is required.

## 📂 Project Structure

Melodia-Music-Player/
│
├── index.html
├── style.css
├── script.js
└── README.md
🚀 How to Run
Option 1 — Live Demo

Simply open the live website:

https://laibasarwar546.github.io/Melodia-Music-Player/

Option 2 — Run Using VS Code
Download or clone this repository.
Open the project folder in Visual Studio Code.
Make sure these files are in the same folder:
index.html
style.css
script.js
Install the Live Server extension in VS Code.
Right-click index.html.
Select Open with Live Server.
Melodia will open automatically in your browser.
Option 3 — Clone from GitHub
git clone https://github.com/laibasarwar546/Melodia-Music-Player.git

Then open the project folder in VS Code and run index.html using Live Server.

No backend setup or API key is required.

💾 Local Storage

Melodia uses browser LocalStorage to save:

❤️ Liked songs
🕘 Recently played songs
🌙 Selected theme

These preferences remain available after refreshing the page.

🎧 How It Works

Users search for a song or artist using the search bar. Melodia sends the search request to the Apple iTunes Search API and displays the matching songs.

When a user selects a song, its available audio preview is loaded into the built-in HTML5 audio player.

When the current preview finishes, Melodia automatically continues playing the next song in the current queue.

🎨 Interface

Melodia includes:

Modern music-player layout
Sidebar navigation
Search interface
Song cards
Bottom music player
Full now-playing section
Library section
Dark/light theme
Responsive layout
👩‍💻 Developer

Laiba Sarwar

GitHub: https://github.com/laibasarwar546

Repository: https://github.com/laibasarwar546/Melodia-Music-Player

📄 License

This project was created for educational and portfolio purposes.
