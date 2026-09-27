let currentAlbumIndex = 0;
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

// Persistent Liked Songs Store (localStorage)
let likedSongs = JSON.parse(localStorage.getItem('cas_liked_songs')) || [];

// DOM Elements
const audio = document.getElementById('audioEngine');
const stageFrame = document.getElementById('stageFrame');
const sleeveJacket = document.getElementById('sleeveJacket');
const coverArt = document.getElementById('coverArt');
const badgeSide = document.getElementById('badgeSide');

const headerSongTitle = document.getElementById('headerSongTitle');
const songTitle = document.getElementById('songTitle');
const albumSubtitle = document.getElementById('albumSubtitle');

const scrubBar = document.getElementById('scrubBar');
const scrubProgress = document.getElementById('scrubProgress');
const currentTimeEl = document.getElementById('currentTime');
const durationTimeEl = document.getElementById('durationTime');

const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const favoriteBtn = document.getElementById('favoriteBtn');

const muteBtn = document.getElementById('muteBtn');
const muteIcon = document.getElementById('muteIcon');

// Navigation Items: Liked (Left), Search (Middle), Library (Right)
const navLiked = document.getElementById('navLiked');
const navSearch = document.getElementById('navSearch');
const navLibrary = document.getElementById('navLibrary');

// Drawers & Modals
const likedDrawer = document.getElementById('likedDrawer');
const likedTracklist = document.getElementById('likedTracklist');
const closeLikedBtn = document.getElementById('closeLikedBtn');

const catalogueDrawer = document.getElementById('catalogueDrawer');
const albumPills = document.getElementById('albumPills');
const catalogueTracklist = document.getElementById('catalogueTracklist');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');

const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const closeSearchBtn = document.getElementById('closeSearchBtn');

const backdrop = document.getElementById('backdrop');

// Speaker SVG Icons (Unmuted vs. Crossed Mute)
const iconUnmuted = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
const iconMuted = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';

// CDN Backup for Images
const cdnFallbacks = {
  cas2017: "https://images.genius.com/0ddda0e3bbd2b5168ea46b6fc525c56c.1000x1000x1.jpg",
  cry2019: "https://images.genius.com/13c6cfbc9cb5bb45fbbfdc5ee2a2bc81.1000x1000x1.jpg",
  xs2024: "https://images.genius.com/4a0ae9b2c7e0b57e79393165b53ecf52.1000x1000x1.jpg"
};

function formatClock(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateFavoriteButtonState(title) {
  const isFav = likedSongs.some(item => item.title === title);
  favoriteBtn.classList.toggle('active', isFav);
}

function loadTrack(albumIdx, trackIdx, startPlaying = false) {
  currentAlbumIndex = albumIdx;
  currentTrackIndex = trackIdx;

  const album = discography[albumIdx];
  const track = album.tracks[trackIdx];

  headerSongTitle.textContent = track.title;
  songTitle.textContent = track.title;
  albumSubtitle.textContent = `${album.albumTitle} • ${album.year}`;
  badgeSide.textContent = trackIdx < 5 ? 'side a' : 'side b';

  coverArt.src = album.cover;
  coverArt.onerror = () => {
    coverArt.src = cdnFallbacks[album.id] || "";
  };

  audio.src = track.src;
  scrubProgress.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  durationTimeEl.textContent = track.duration;

  updateFavoriteButtonState(track.title);
  renderCatalogue();

  if (startPlaying) {
    playAudio();
  }
}

function playAudio() {
  audio.play().then(() => {
    isPlaying = true;
    stageFrame.classList.add('playing');
    playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  }).catch(e => console.log('Playback requires user interaction or media loaded:', e));
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  stageFrame.classList.remove('playing');
  playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
}

function togglePlay() {
  if (isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function nextTrack() {
  const album = discography[currentAlbumIndex];
  if (isShuffle) {
    currentTrackIndex = Math.floor(Math.random() * album.tracks.length);
  } else {
    currentTrackIndex++;
    if (currentTrackIndex >= album.tracks.length) {
      currentTrackIndex = 0;
      currentAlbumIndex = (currentAlbumIndex + 1) % discography.length;
    }
  }
  loadTrack(currentAlbumIndex, currentTrackIndex, isPlaying);
}

function prevTrack() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentTrackIndex--;
  if (currentTrackIndex < 0) {
    currentAlbumIndex = (currentAlbumIndex - 1 + discography.length) % discography.length;
    currentTrackIndex = discography[currentAlbumIndex].tracks.length - 1;
  }
  loadTrack(currentAlbumIndex, currentTrackIndex, isPlaying);
}

// Scrubber Time Tracking
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const ratio = audio.currentTime / audio.duration;
    scrubProgress.style.width = `${ratio * 100}%`;
    currentTimeEl.textContent = formatClock(audio.currentTime);
  }
});

audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    playAudio();
  } else {
    nextTrack();
  }
});

scrubBar.addEventListener('click', (e) => {
  const rect = scrubBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
  if (audio.duration) {
    audio.currentTime = ratio * audio.duration;
  }
});

// Controls
playBtn.addEventListener('click', togglePlay);
sleeveJacket.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
});

muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  muteIcon.innerHTML = audio.muted ? iconMuted : iconUnmuted;
});

// Favorite / Liked Songs Logic
favoriteBtn.addEventListener('click', () => {
  const currentTrack = discography[currentAlbumIndex].tracks[currentTrackIndex];
  const existsIndex = likedSongs.findIndex(item => item.title === currentTrack.title);

  if (existsIndex > -1) {
    likedSongs.splice(existsIndex, 1);
    favoriteBtn.classList.remove('active');
  } else {
    likedSongs.push({
      albumIndex: currentAlbumIndex,
      trackIndex: currentTrackIndex,
      title: currentTrack.title,
      duration: currentTrack.duration,
      year: discography[currentAlbumIndex].year
    });
    favoriteBtn.classList.add('active');
  }

  localStorage.setItem('cas_liked_songs', JSON.stringify(likedSongs));
  renderLikedSongs();
});

function renderLikedSongs() {
  likedTracklist.innerHTML = '';

  if (likedSongs.length === 0) {
    likedTracklist.innerHTML = '<div class="empty-state">no liked songs yet</div>';
    return;
  }

  likedSongs.forEach((item, idx) => {
    const isCurrent = item.albumIndex === currentAlbumIndex && item.trackIndex === currentTrackIndex;
    const row = document.createElement('div');
    row.className = `catalogue-item ${isCurrent ? 'active' : ''}`;
    row.innerHTML = `
      <div class="cat-left">
        <span class="cat-idx">${idx + 1}</span>
        <span class="cat-title">${item.title}</span>
      </div>
      <span class="cat-duration">${item.duration}</span>
    `;

    row.addEventListener('click', () => {
      loadTrack(item.albumIndex, item.trackIndex, true);
      closeAllModals();
    });

    likedTracklist.appendChild(row);
  });
}

// Catalogue Drawer
function initCatalogue() {
  albumPills.innerHTML = '';
  discography.forEach((album, idx) => {
    const pill = document.createElement('button');
    pill.className = `album-pill ${idx === currentAlbumIndex ? 'active' : ''}`;
    pill.textContent = album.year;
    pill.addEventListener('click', () => {
      document.querySelectorAll('.album-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderCatalogue(idx);
    });
    albumPills.appendChild(pill);
  });
  renderCatalogue(currentAlbumIndex);
}

function renderCatalogue(albumIdx = currentAlbumIndex) {
  const album = discography[albumIdx];
  catalogueTracklist.innerHTML = '';

  album.tracks.forEach((track, idx) => {
    const isCurrent = albumIdx === currentAlbumIndex && idx === currentTrackIndex;
    const row = document.createElement('div');
    row.className = `catalogue-item ${isCurrent ? 'active' : ''}`;
    row.innerHTML = `
      <div class="cat-left">
        <span class="cat-idx">${idx + 1}</span>
        <span class="cat-title">${track.title}</span>
      </div>
      <span class="cat-duration">${track.duration}</span>
    `;

    row.addEventListener('click', () => {
      loadTrack(albumIdx, idx, true);
      closeAllModals();
    });

    catalogueTracklist.appendChild(row);
  });
}

// Search Modal
function initSearch() {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    searchResults.innerHTML = '';
    if (!query) return;

    discography.forEach((album, aIdx) => {
      album.tracks.forEach((track, tIdx) => {
        if (track.title.toLowerCase().includes(query)) {
          const item = document.createElement('div');
          item.className = 'catalogue-item';
          item.innerHTML = `
            <div class="cat-left">
              <span class="cat-title">${track.title}</span>
            </div>
            <span class="cat-duration">${album.year}</span>
          `;
          item.addEventListener('click', () => {
            loadTrack(aIdx, tIdx, true);
            closeAllModals();
          });
          searchResults.appendChild(item);
        }
      });
    });
  });
}

// Modal and Navigation Switching
function clearActiveNavs() {
  navLiked.classList.remove('active');
  navSearch.classList.remove('active');
  navLibrary.classList.remove('active');
}

function openLiked() {
  closeAllModals();
  renderLikedSongs();
  likedDrawer.classList.add('open');
  backdrop.classList.add('active');
  navLiked.classList.add('active');
}

function openSearch() {
  closeAllModals();
  searchModal.classList.add('open');
  backdrop.classList.add('active');
  navSearch.classList.add('active');
  searchInput.focus();
}

function openLibrary() {
  closeAllModals();
  renderCatalogue(currentAlbumIndex);
  catalogueDrawer.classList.add('open');
  backdrop.classList.add('active');
  navLibrary.classList.add('active');
}

function closeAllModals() {
  likedDrawer.classList.remove('open');
  catalogueDrawer.classList.remove('open');
  searchModal.classList.remove('open');
  backdrop.classList.remove('active');
  searchInput.value = '';
  searchResults.innerHTML = '';
  clearActiveNavs();
}

// Navigation Listeners
navLiked.addEventListener('click', () => {
  if (likedDrawer.classList.contains('open')) {
    closeAllModals();
  } else {
    openLiked();
  }
});

navSearch.addEventListener('click', () => {
  if (searchModal.classList.contains('open')) {
    closeAllModals();
  } else {
    openSearch();
  }
});

navLibrary.addEventListener('click', () => {
  if (catalogueDrawer.classList.contains('open')) {
    closeAllModals();
  } else {
    openLibrary();
  }
});

closeLikedBtn.addEventListener('click', closeAllModals);
closeDrawerBtn.addEventListener('click', closeAllModals);
closeSearchBtn.addEventListener('click', closeAllModals);
backdrop.addEventListener('click', closeAllModals);

// Initialize App
initCatalogue();
initSearch();
renderLikedSongs();
loadTrack(0, 0, false);