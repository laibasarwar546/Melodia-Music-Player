/* =========================================================
   MELODIA
   iTunes Search API Music Player
   ========================================================= */

const ITUNES_API = "https://itunes.apple.com/search";


/* =========================================================
   DOM
========================================================= */

const audioPlayer = document.getElementById("audioPlayer");

const playerCover = document.getElementById("playerCover");
const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");

const bigPlayerCover = document.getElementById("bigPlayerCover");
const bigPlayerTitle = document.getElementById("bigPlayerTitle");
const bigPlayerArtist = document.getElementById("bigPlayerArtist");
const bigPlayerAlbum = document.getElementById("bigPlayerAlbum");

const currentTimeElement = document.getElementById("currentTime");
const durationElement = document.getElementById("duration");
const progressBar = document.getElementById("progressBar");

const bigCurrentTime = document.getElementById("bigCurrentTime");
const bigDuration = document.getElementById("bigDuration");
const bigProgressFill = document.getElementById("bigProgressFill");
const bigProgressTrack = document.getElementById("bigProgressTrack");

const volumeBar = document.getElementById("volumeBar");
const volumeBtn = document.getElementById("volumeBtn");

const playBtn = document.getElementById("playBtn");
const nextBtn = document.getElementById("nextBtn");
const previousBtn = document.getElementById("previousBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const likeBtn = document.getElementById("likeBtn");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchResults = document.getElementById("searchResults");
const searchStatus = document.getElementById("searchStatus");

const recentSongs = document.getElementById("recentSongs");
const popularSongs = document.getElementById("popularSongs");
const libraryContent = document.getElementById("libraryContent");

const themeToggle = document.getElementById("themeToggle");
const heroPlayBtn = document.getElementById("heroPlayBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const loadingOverlay = document.getElementById("loadingOverlay");


/* =========================================================
   STATE
========================================================= */

let currentSong = null;
let currentQueue = [];
let currentIndex = -1;

let searchQuery = "";

let isShuffle = false;
let repeatMode = false;

let isMuted = false;
let lastVolume = 0.8;

let searchTimer = null;
let toastTimer = null;


/* =========================================================
   STORAGE
========================================================= */

let likedSongs = JSON.parse(
    localStorage.getItem("melodiaLikedSongs") || "[]"
);

let recentlyPlayed = JSON.parse(
    localStorage.getItem("melodiaRecentlyPlayed") || "[]"
);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", init);

function init() {

    setupNavigation();
    setupSearch();
    setupControls();
    setupTheme();
    setupSidebar();
    setupLibraryTabs();
    setupShowAllButtons();
    setupHistoryButtons();
    setupAudioEvents();

    renderRecentlyPlayed();
    renderLikedSongs();

    loadPopularSongs();

    if (volumeBar) {
        audioPlayer.volume =
            Number(volumeBar.value || 80) / 100;
    } else {
        audioPlayer.volume = 0.8;
    }

    lastVolume = audioPlayer.volume;

    updateVolumeIcon();
    updateLikeButton();
}


/* =========================================================
   ITUNES SEARCH
========================================================= */

async function searchITunes(query, limit = 40) {

    const url =
        `${ITUNES_API}?term=${encodeURIComponent(query)}` +
        `&media=music` +
        `&entity=song` +
        `&attribute=songTerm` +
        `&country=US` +
        `&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("iTunes request failed");
    }

    const data = await response.json();

    return data.results || [];
}


/* =========================================================
   CONVERT ITUNES SONG
========================================================= */

function convertITunesSong(item) {

    const artwork = item.artworkUrl100
        ? item.artworkUrl100.replace(
            "100x100bb",
            "600x600bb"
        )
        : "";

    return {
        id: String(
            item.trackId ||
            `${item.artistName}-${item.trackName}`
        ),

        trackId: item.trackId,

        title: item.trackName || "Unknown Song",

        artist: item.artistName || "Unknown Artist",

        album: item.collectionName || "iTunes",

        thumbnail: artwork,

        previewUrl: item.previewUrl || "",

        duration:
            Number(item.trackTimeMillis || 0) / 1000,

        genre: item.primaryGenreName || "Music",

        releaseDate: item.releaseDate || "",

        explicit:
            item.trackExplicitness === "explicit"
    };
}


/* =========================================================
   CLEAN SONGS
========================================================= */

function cleanSongs(results) {

    const seen = new Set();

    return results
        .map(convertITunesSong)
        .filter(song => {

            if (!song.previewUrl) {
                return false;
            }

            const key = song.trackId || song.id;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;
        });
}


/* =========================================================
   SEARCH MUSIC
========================================================= */

async function searchMusic(query) {

    const cleanQuery = query.trim();

    if (!cleanQuery) {
        return;
    }

    searchQuery = cleanQuery;

    showSection("search");

    if (searchStatus) {
        searchStatus.textContent =
            `Searching for "${cleanQuery}"...`;
    }

    showLoading(searchResults);

    try {

        const results =
            await searchITunes(cleanQuery, 50);

        const songs =
            cleanSongs(results);

        /*
         * IMPORTANT:
         * Search results become the current queue.
         * Auto-next will ONLY use these results.
         */

        currentQueue = songs;
        currentIndex = -1;

        renderSearchResults(songs);

        if (searchStatus) {
            searchStatus.textContent =
                songs.length
                    ? `${songs.length} songs found for "${cleanQuery}".`
                    : `No songs found for "${cleanQuery}".`;
        }

        showToast(
            songs.length
                ? `${songs.length} songs found`
                : "No songs found"
        );

    } catch (error) {

        console.error("Search error:", error);

        currentQueue = [];
        currentIndex = -1;

        if (searchResults) {
            searchResults.innerHTML = `
                <div class="message-card">
                    <h3>Unable to search music</h3>
                    <p>
                        Please check your internet connection
                        and try again.
                    </p>
                </div>
            `;
        }

        if (searchStatus) {
            searchStatus.textContent =
                "Search failed. Please try again.";
        }
    }
}


/* =========================================================
   RENDER SEARCH RESULTS
========================================================= */

function renderSearchResults(songs) {

    if (!searchResults) {
        return;
    }

    searchResults.innerHTML = "";

    if (!songs.length) {

        searchResults.innerHTML = `
            <div class="message-card">
                <h3>No songs found</h3>
                <p>
                    Try another artist or song name.
                </p>
            </div>
        `;

        return;
    }

    songs.forEach((song, index) => {

        searchResults.appendChild(
            createSongCard(song, index)
        );

    });
}


/* =========================================================
   CREATE SONG CARD
========================================================= */

function createSongCard(song, index = -1) {

    const card = document.createElement("article");

    card.className = "song-card";

    card.dataset.trackId =
        song.trackId || song.id;

    const image =
        song.thumbnail ||
        "https://placehold.co/600x600/181818/ffffff?text=♫";

    card.innerHTML = `
        <div class="song-card-image-wrapper">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(song.title)}"
                loading="lazy"
            >

        </div>

        <h3>
            ${escapeHTML(song.title)}
        </h3>

        <p>
            ${escapeHTML(song.artist)}
        </p>
    `;

    card.addEventListener("click", () => {

        const queueIndex =
            currentQueue.findIndex(
                item =>
                    String(
                        item.trackId || item.id
                    ) ===
                    String(
                        song.trackId || song.id
                    )
            );

        if (queueIndex !== -1) {

            currentIndex = queueIndex;

        } else {

            currentQueue = [song];
            currentIndex = 0;
        }

        playSong(song, true);
    });

    return card;
}


/* =========================================================
   PLAY SONG
========================================================= */

function playSong(song, addToRecent = true) {

    if (!song) {
        return;
    }

    if (!song.previewUrl) {

        showToast(
            "This song has no preview"
        );

        /*
         * If an unavailable song is encountered
         * during auto-next, automatically try another.
         */

        if (
            currentQueue.length > 1 &&
            currentIndex >= 0
        ) {
            setTimeout(() => playNext(), 100);
        }

        return;
    }

    currentSong = song;

    updatePlayerUI(song);
    updateLikeButton();

    audioPlayer.pause();

    audioPlayer.removeAttribute("src");

    audioPlayer.load();

    audioPlayer.src = song.previewUrl;

    audioPlayer.load();

    const playPromise = audioPlayer.play();

    if (playPromise) {

        playPromise
            .then(() => {

                setPlayingState(true);

            })
            .catch(error => {

                console.error(
                    "Playback error:",
                    error
                );

                setPlayingState(false);

                showToast(
                    "Unable to play this preview"
                );
            });
    }

    if (addToRecent) {
        addRecentlyPlayed(song);
    }
}


/* =========================================================
   AUDIO EVENTS
========================================================= */

function setupAudioEvents() {

    if (!audioPlayer) {
        return;
    }

    audioPlayer.addEventListener(
        "loadedmetadata",
        () => {

            updateDuration(
                audioPlayer.duration
            );
        }
    );

    audioPlayer.addEventListener(
        "timeupdate",
        () => {

            updateProgress();
        }
    );

    audioPlayer.addEventListener(
        "play",
        () => {

            setPlayingState(true);
        }
    );

    audioPlayer.addEventListener(
        "pause",
        () => {

            setPlayingState(false);
        }
    );

    /*
     * =====================================================
     * AUTO NEXT
     * =====================================================
     *
     * This is the important part.
     *
     * When the iTunes preview finishes:
     *
     * 1. Repeat ON  -> same song plays again
     * 2. Shuffle ON -> random song from current queue
     * 3. Normal     -> next song in current queue
     * 4. End reached + repeat OFF -> stop
     *
     * It NEVER performs a new search.
     */

    audioPlayer.addEventListener(
        "ended",
        () => {

            setPlayingState(false);

            audioPlayer.currentTime = 0;

            updateProgress();

            /*
             * Repeat mode:
             * replay the exact same song.
             */

            if (repeatMode) {

                playSong(
                    currentSong,
                    false
                );

                return;
            }

            /*
             * Otherwise automatically move
             * to the next song.
             */

            playNext(true);
        }
    );

    audioPlayer.addEventListener(
        "error",
        () => {

            setPlayingState(false);

            /*
             * If the current preview fails,
             * automatically try the next song.
             */

            if (currentQueue.length > 1) {

                showToast(
                    "Preview unavailable — trying next song"
                );

                setTimeout(() => {

                    playNext(true);

                }, 500);

            } else {

                showToast(
                    "Audio preview unavailable"
                );
            }
        }
    );
}


/* =========================================================
   PLAY / PAUSE
========================================================= */

async function togglePlay() {

    if (!currentSong) {

        if (currentQueue.length > 0) {

            currentIndex =
                currentIndex >= 0
                    ? currentIndex
                    : 0;

            playSong(
                currentQueue[currentIndex],
                true
            );

            return;
        }

        if (recentlyPlayed.length > 0) {

            currentQueue =
                [...recentlyPlayed];

            currentIndex = 0;

            playSong(
                currentQueue[0],
                true
            );

            return;
        }

        showToast(
            "Search for a song first"
        );

        return;
    }

    if (audioPlayer.paused) {

        try {

            await audioPlayer.play();

        } catch (error) {

            console.error(error);

            showToast(
                "Unable to play song"
            );
        }

    } else {

        audioPlayer.pause();
    }
}


/* =========================================================
   PLAY NEXT
========================================================= */

function playNext(autoPlay = false) {

    if (!currentQueue.length) {

        showToast(
            "No next song available"
        );

        return;
    }

    /*
     * SHUFFLE
     */

    if (isShuffle) {

        let nextIndex;

        if (currentQueue.length === 1) {

            nextIndex = 0;

        } else {

            do {

                nextIndex =
                    Math.floor(
                        Math.random() *
                        currentQueue.length
                    );

            } while (
                nextIndex === currentIndex
            );
        }

        currentIndex = nextIndex;

    } else {

        /*
         * NORMAL ORDER
         */

        let nextIndex =
            currentIndex + 1;

        /*
         * If currentIndex is -1,
         * start from first song.
         */

        if (currentIndex < 0) {
            nextIndex = 0;
        }

        /*
         * Reached end.
         */

        if (
            nextIndex >=
            currentQueue.length
        ) {

            if (repeatMode) {

                currentIndex = 0;

            } else {

                /*
                 * Playlist finished.
                 */

                if (autoPlay) {

                    setPlayingState(false);

                    showToast(
                        "Playlist finished"
                    );

                } else {

                    showToast(
                        "End of playlist"
                    );
                }

                return;
            }

        } else {

            currentIndex = nextIndex;
        }
    }

    const nextSong =
        currentQueue[currentIndex];

    if (!nextSong) {
        return;
    }

    /*
     * Auto-next uses the same queue.
     * No new search is performed.
     */

    playSong(
        nextSong,
        true
    );
}


/* =========================================================
   PLAY PREVIOUS
========================================================= */

function playPrevious() {

    if (!currentQueue.length) {

        showToast(
            "No previous song available"
        );

        return;
    }

    /*
     * If current song has played more than 3 seconds,
     * restart current song first.
     */

    if (
        audioPlayer.currentTime > 3
    ) {

        audioPlayer.currentTime = 0;

        return;
    }

    let previousIndex =
        currentIndex - 1;

    if (previousIndex < 0) {

        if (repeatMode) {

            previousIndex =
                currentQueue.length - 1;

        } else {

            previousIndex = 0;
        }
    }

    currentIndex =
        previousIndex;

    playSong(
        currentQueue[currentIndex],
        true
    );
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const current =
        audioPlayer.currentTime || 0;

    const duration =
        audioPlayer.duration || 0;

    const percentage =
        duration > 0
            ? (current / duration) * 100
            : 0;

    if (progressBar) {
        progressBar.value =
            percentage;
    }

    if (bigProgressFill) {
        bigProgressFill.style.width =
            `${percentage}%`;
    }

    if (currentTimeElement) {
        currentTimeElement.textContent =
            formatTime(current);
    }

    if (bigCurrentTime) {
        bigCurrentTime.textContent =
            formatTime(current);
    }
}


/* =========================================================
   DURATION
========================================================= */

function updateDuration(duration) {

    const formatted =
        formatTime(duration);

    if (durationElement) {
        durationElement.textContent =
            formatted;
    }

    if (bigDuration) {
        bigDuration.textContent =
            formatted;
    }
}


/* =========================================================
   PROGRESS BAR SEEK
========================================================= */

function setupProgressBar() {

    if (progressBar) {

        progressBar.addEventListener(
            "input",
            () => {

                const duration =
                    audioPlayer.duration;

                if (
                    !Number.isFinite(duration) ||
                    duration <= 0
                ) {
                    return;
                }

                const percentage =
                    Number(
                        progressBar.value
                    );

                audioPlayer.currentTime =
                    duration *
                    (percentage / 100);
            }
        );
    }

    bigProgressTrack?.addEventListener(
        "click",
        event => {

            const rect =
                bigProgressTrack.getBoundingClientRect();

            const position =
                event.clientX -
                rect.left;

            const percentage =
                Math.max(
                    0,
                    Math.min(
                        1,
                        position / rect.width
                    )
                );

            if (
                Number.isFinite(
                    audioPlayer.duration
                )
            ) {

                audioPlayer.currentTime =
                    audioPlayer.duration *
                    percentage;
            }
        }
    );
}


/* =========================================================
   DURATION FORMAT
========================================================= */

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        return "0:00";
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainingSeconds =
        Math.floor(
            seconds % 60
        );

    return `${minutes}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


/* =========================================================
   PLAYER UI
========================================================= */

function updatePlayerUI(song) {

    const image =
        song.thumbnail ||
        "https://placehold.co/600x600/181818/ffffff?text=♫";

    if (playerCover) {
        playerCover.src = image;
    }

    if (playerTitle) {
        playerTitle.textContent =
            song.title;
    }

    if (playerArtist) {
        playerArtist.textContent =
            song.artist;
    }

    if (bigPlayerCover) {
        bigPlayerCover.src = image;
    }

    if (bigPlayerTitle) {
        bigPlayerTitle.textContent =
            song.title;
    }

    if (bigPlayerArtist) {
        bigPlayerArtist.textContent =
            song.artist;
    }

    if (bigPlayerAlbum) {
        bigPlayerAlbum.textContent =
            song.album || "iTunes";
    }

    if (durationElement) {
        durationElement.textContent =
            formatTime(song.duration);
    }

    if (bigDuration) {
        bigDuration.textContent =
            formatTime(song.duration);
    }

    if (currentTimeElement) {
        currentTimeElement.textContent =
            "0:00";
    }

    if (bigCurrentTime) {
        bigCurrentTime.textContent =
            "0:00";
    }

    if (progressBar) {
        progressBar.value = 0;
    }

    if (bigProgressFill) {
        bigProgressFill.style.width =
            "0%";
    }
}


/* =========================================================
   PLAYING STATE
========================================================= */

function setPlayingState(playing) {

    document.body.classList.toggle(
        "is-playing",
        playing
    );

    if (playBtn) {

        playBtn.textContent =
            playing
                ? "Ⅱ"
                : "▶";
    }
}


/* =========================================================
   VOLUME
========================================================= */

function setupVolume() {

    volumeBar?.addEventListener(
        "input",
        () => {

            const value =
                Number(
                    volumeBar.value
                ) / 100;

            audioPlayer.volume =
                value;

            if (value > 0) {

                lastVolume = value;
                isMuted = false;
            }

            updateVolumeIcon();
        }
    );

    volumeBtn?.addEventListener(
        "click",
        toggleMute
    );
}


function toggleMute() {

    if (isMuted) {

        audioPlayer.volume =
            lastVolume || 0.8;

        if (volumeBar) {
            volumeBar.value =
                (lastVolume || 0.8) * 100;
        }

        isMuted = false;

    } else {

        lastVolume =
            audioPlayer.volume || 0.8;

        audioPlayer.volume = 0;

        if (volumeBar) {
            volumeBar.value = 0;
        }

        isMuted = true;
    }

    updateVolumeIcon();
}


function updateVolumeIcon() {

    if (!volumeBtn) {
        return;
    }

    if (audioPlayer.volume === 0) {

        volumeBtn.textContent =
            "🔇";

    } else if (
        audioPlayer.volume < 0.5
    ) {

        volumeBtn.textContent =
            "🔉";

    } else {

        volumeBtn.textContent =
            "🔊";
    }
}


/* =========================================================
   CONTROLS
========================================================= */

function setupControls() {

    playBtn?.addEventListener(
        "click",
        togglePlay
    );

    nextBtn?.addEventListener(
        "click",
        () => playNext(false)
    );

    previousBtn?.addEventListener(
        "click",
        playPrevious
    );

    shuffleBtn?.addEventListener(
        "click",
        () => {

            isShuffle =
                !isShuffle;

            shuffleBtn.classList.toggle(
                "active",
                isShuffle
            );

            showToast(
                isShuffle
                    ? "Shuffle enabled"
                    : "Shuffle disabled"
            );
        }
    );

    repeatBtn?.addEventListener(
        "click",
        () => {

            repeatMode =
                !repeatMode;

            repeatBtn.classList.toggle(
                "active",
                repeatMode
            );

            showToast(
                repeatMode
                    ? "Repeat enabled"
                    : "Repeat disabled"
            );
        }
    );

    likeBtn?.addEventListener(
        "click",
        toggleLike
    );

    setupProgressBar();
    setupVolume();
}


/* =========================================================
   LIKE
========================================================= */

function toggleLike() {

    if (!currentSong) {

        showToast(
            "Play a song first"
        );

        return;
    }

    const id =
        currentSong.trackId ||
        currentSong.id;

    const exists =
        likedSongs.some(
            song =>
                String(
                    song.trackId ||
                    song.id
                ) ===
                String(id)
        );

    if (exists) {

        likedSongs =
            likedSongs.filter(
                song =>
                    String(
                        song.trackId ||
                        song.id
                    ) !==
                    String(id)
            );

        showToast(
            "Removed from liked songs"
        );

    } else {

        likedSongs.unshift(
            currentSong
        );

        showToast(
            "Added to liked songs"
        );
    }

    localStorage.setItem(
        "melodiaLikedSongs",
        JSON.stringify(
            likedSongs
        )
    );

    updateLikeButton();
    renderLikedSongs();
}


function updateLikeButton() {

    if (!likeBtn) {
        return;
    }

    if (!currentSong) {

        likeBtn.textContent = "♡";

        likeBtn.classList.remove(
            "active"
        );

        return;
    }

    const id =
        currentSong.trackId ||
        currentSong.id;

    const liked =
        likedSongs.some(
            song =>
                String(
                    song.trackId ||
                    song.id
                ) ===
                String(id)
        );

    likeBtn.textContent =
        liked
            ? "♥"
            : "♡";

    likeBtn.classList.toggle(
        "active",
        liked
    );
}


/* =========================================================
   RECENTLY PLAYED
========================================================= */

function addRecentlyPlayed(song) {

    const id =
        song.trackId ||
        song.id;

    recentlyPlayed =
        recentlyPlayed.filter(
            item =>
                String(
                    item.trackId ||
                    item.id
                ) !==
                String(id)
        );

    recentlyPlayed.unshift(song);

    recentlyPlayed =
        recentlyPlayed.slice(
            0,
            20
        );

    localStorage.setItem(
        "melodiaRecentlyPlayed",
        JSON.stringify(
            recentlyPlayed
        )
    );

    renderRecentlyPlayed();
}


function renderRecentlyPlayed() {

    if (!recentSongs) {
        return;
    }

    recentSongs.innerHTML = "";

    if (!recentlyPlayed.length) {

        recentSongs.innerHTML = `
            <div class="message-card">
                <h3>No recently played songs</h3>
                <p>
                    Your played songs will appear here.
                </p>
            </div>
        `;

        return;
    }

    recentlyPlayed
        .slice(0, 6)
        .forEach(song => {

            recentSongs.appendChild(
                createSongCard(song)
            );

        });
}


/* =========================================================
   LIBRARY
========================================================= */

function renderLikedSongs() {

    if (!libraryContent) {
        return;
    }

    libraryContent.innerHTML = "";

    if (!likedSongs.length) {

        libraryContent.innerHTML = `
            <div class="message-card">
                <h3>Your library is empty</h3>
                <p>
                    Like songs to save them here.
                </p>
            </div>
        `;

        return;
    }

    likedSongs.forEach(song => {

        libraryContent.appendChild(
            createSongCard(song)
        );

    });
}


/* =========================================================
   POPULAR SONGS
========================================================= */

async function loadPopularSongs() {

    if (!popularSongs) {
        return;
    }

    showLoading(popularSongs);

    const searches = [
        "Taylor Swift hits",
        "The Weeknd hits",
        "Billie Eilish hits",
        "Arijit Singh songs",
        "Atif Aslam songs",
        "Karan Aujla songs",
        "Ariana Grande hits",
        "Ed Sheeran hits"
    ];

    try {

        const requests =
            searches.map(
                term =>
                    searchITunes(
                        term,
                        6
                    )
            );

        const results =
            await Promise.all(
                requests
            );

        const combined =
            results.flat();

        let songs =
            cleanSongs(combined);

        songs =
            shuffleArray(songs);

        songs =
            songs.slice(0, 16);

        popularSongs.innerHTML = "";

        songs.forEach(song => {

            popularSongs.appendChild(
                createSongCard(song)
            );

        });

        if (
            !searchQuery &&
            songs.length
        ) {

            currentQueue = songs;
            currentIndex = -1;
        }

    } catch (error) {

        console.error(
            "Popular songs error:",
            error
        );

        popularSongs.innerHTML = `
            <div class="message-card">
                <h3>Unable to load popular songs</h3>
                <p>
                    Please refresh the page.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   SHUFFLE ARRAY
========================================================= */

function shuffleArray(array) {

    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const section =
                    item.dataset.section;

                showSection(section);

                navItems.forEach(nav =>
                    nav.classList.remove(
                        "active"
                    )
                );

                item.classList.add(
                    "active"
                );
            }
        );
    });
}


function showSection(section) {

    document
        .querySelectorAll(
            ".content-section"
        )
        .forEach(element =>
            element.classList.remove(
                "active-section"
            )
        );

    const target =
        document.getElementById(
            `${section}Section`
        );

    if (target) {

        target.classList.add(
            "active-section"
        );
    }

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.section ===
                section
            );
        });
}


/* =========================================================
   SEARCH SETUP
========================================================= */

function setupSearch() {

    searchInput?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                clearTimeout(
                    searchTimer
                );

                searchMusic(
                    searchInput.value
                );
            }
        }
    );

    searchInput?.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimer
            );

            const value =
                searchInput.value.trim();

            if (clearSearchBtn) {

                clearSearchBtn.style.display =
                    value
                        ? "block"
                        : "none";
            }

            if (!value) {
                return;
            }

            searchTimer =
                setTimeout(
                    () => {

                        searchMusic(value);

                    },
                    700
                );
        }
    );

    clearSearchBtn?.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            clearSearchBtn.style.display =
                "none";

            if (searchResults) {
                searchResults.innerHTML = "";
            }

            if (searchStatus) {

                searchStatus.textContent =
                    "Search for a song or artist to begin.";
            }
        }
    );
}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    document
        .querySelectorAll(
            "[data-playlist]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.playlist;

                    showSection("library");

                    if (type === "liked") {

                        setLibraryTab("liked");
                    }

                    if (type === "recent") {

                        setLibraryTab("recent");
                    }
                }
            );
        });
}


/* =========================================================
   LIBRARY TABS
========================================================= */

function setupLibraryTabs() {

    document
        .querySelectorAll(
            ".library-tab"
        )
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    setLibraryTab(
                        tab.dataset.library
                    );
                }
            );
        });
}


function setLibraryTab(type) {

    document
        .querySelectorAll(
            ".library-tab"
        )
        .forEach(tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.library === type
            );
        });

    if (!libraryContent) {
        return;
    }

    libraryContent.innerHTML = "";

    const songs =
        type === "liked"
            ? likedSongs
            : recentlyPlayed;

    if (!songs.length) {

        libraryContent.innerHTML = `
            <div class="message-card">
                <h3>
                    ${
                        type === "liked"
                            ? "No liked songs"
                            : "No recently played songs"
                    }
                </h3>
                <p>
                    Your music will appear here.
                </p>
            </div>
        `;

        return;
    }

    songs.forEach(song => {

        libraryContent.appendChild(
            createSongCard(song)
        );

    });
}


/* =========================================================
   SHOW ALL
========================================================= */

function setupShowAllButtons() {

    document
        .querySelectorAll(
            ".show-all-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.show;

                    if (type === "recent") {

                        showSection("library");

                        setLibraryTab(
                            "recent"
                        );
                    }

                    if (type === "popular") {

                        popularSongs?.scrollIntoView({
                            behavior: "smooth"
                        });
                    }
                }
            );
        });
}


/* =========================================================
   HERO BUTTON
========================================================= */

heroPlayBtn?.addEventListener(
    "click",
    () => {

        if (currentSong) {

            togglePlay();

            return;
        }

        if (currentQueue.length) {

            currentIndex =
                currentIndex >= 0
                    ? currentIndex
                    : 0;

            playSong(
                currentQueue[currentIndex],
                true
            );

            return;
        }

        if (popularSongs) {

            const firstCard =
                popularSongs.querySelector(
                    ".song-card"
                );

            firstCard?.click();

            return;
        }

        showToast(
            "Search for music first"
        );
    }
);


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const saved =
        localStorage.getItem(
            "melodiaTheme"
        );

    if (saved === "light") {

        document.body.classList.add(
            "light-theme"
        );

        if (themeToggle) {
            themeToggle.textContent =
                "🌙";
        }
    }

    themeToggle?.addEventListener(
        "click",
        () => {

            const isLight =
                document.body.classList.toggle(
                    "light-theme"
                );

            localStorage.setItem(
                "melodiaTheme",
                isLight
                    ? "light"
                    : "dark"
            );

            themeToggle.textContent =
                isLight
                    ? "🌙"
                    : "☀️";
        }
    );
}


/* =========================================================
   BACK / FORWARD
========================================================= */

function setupHistoryButtons() {

    document
        .getElementById("backBtn")
        ?.addEventListener(
            "click",
            () => {

                window.history.back();
            }
        );

    document
        .getElementById("forwardBtn")
        ?.addEventListener(
            "click",
            () => {

                window.history.forward();
            }
        );
}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.target.matches("input")
        ) {
            return;
        }

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            togglePlay();
        }

        if (
            event.code === "ArrowRight"
        ) {

            playNext(false);
        }

        if (
            event.code === "ArrowLeft"
        ) {

            playPrevious();
        }
    }
);


/* =========================================================
   LOADING
========================================================= */

function showLoading(element) {

    if (!element) {
        return;
    }

    element.innerHTML = `
        <div class="message-card">

            <div
                class="loading-spinner"
                style="margin:auto"
            ></div>

            <p style="margin-top:15px">
                Loading music...
            </p>

        </div>
    `;
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }

    toastMessage.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}