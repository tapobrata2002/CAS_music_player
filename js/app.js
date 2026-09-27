let currentAlbumIndex = 0;
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

// DOM Elements
const audio = document.getElementById('audioEngine');
const recordAssembly = document.getElementById('recordAssembly');
const sleeveJacket = document.getElementById('sleeveJacket');
const coverArt = document.getElementById('coverArt');

const trackName = document.getElementById('trackName');
const trackRelease = document.getElementById('trackRelease');
const sideIndicator = document.getElementById('sideIndicator');

const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const remainingTimeEl = document.getElementById('remainingTime');

const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');

const muteBtn = document.getElementById('muteBtn');
const muteIcon = document.getElementById('muteIcon');

const archiveSheet = document.getElementById('archiveSheet');
const sheetOverlay = document.getElementById('sheetOverlay');
const archiveTrigger = document.getElementById('archiveTrigger');
const drawerTrigger = document.getElementById('drawerTrigger');
const closeArchiveBtn = document.getElementById('closeArchiveBtn');
const albumChips = document.getElementById('albumChips');
const sheetTracklist = document.getElementById('sheetTracklist');

// Speaker SVG Icons (Unmuted vs. Crossed-Out Muted)
const iconUnmuted = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
const iconMuted = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';

// CDN Backup in case local images are missing
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

function loadTrack(albumIdx, trackIdx, startPlaying = false) {
  currentAlbumIndex = albumIdx;
  currentTrackIndex = trackIdx;

  const album = discography[albumIdx];
  const track = album.tracks[trackIdx];

  trackName.textContent = track.title;
  trackRelease.textContent = `${album.albumTitle} — ${album.year}`;

  const side = trackIdx < 5 ? 'A' : 'B';
  const trackNumPadded = (trackIdx + 1) < 10 ? `0${trackIdx + 1}` : `${trackIdx + 1}`;
  sideIndicator.textContent = `SIDE ${side} — ${trackNumPadded}`;

  // Direct load of local .jpg, with CDN fallback on error
  coverArt.src = album.cover;
  coverArt.onerror = () => {
    coverArt.src = cdnFallbacks[album.id] || "";
  };

  audio.src = track.src;
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  remainingTimeEl.textContent = `-${track.duration}`;

  renderTracklist();

  if (startPlaying) {
    playAudio();
  }
}

function playAudio() {
  audio.play().then(() => {
    isPlaying = true;
    recordAssembly.classList.add('playing');
    playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  }).catch(e => console.log('File loading or user interaction required:', e));
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  recordAssembly.classList.remove('playing');
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

// Scrubber & Time Updates
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const ratio = audio.currentTime / audio.duration;
    progressFill.style.width = `${ratio * 100}%`;
    currentTimeEl.textContent = formatClock(audio.currentTime);

    const remaining = audio.duration - audio.currentTime;
    remainingTimeEl.textContent = `-${formatClock(remaining)}`;
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

progressTrack.addEventListener('click', (e) => {
  const rect = progressTrack.getBoundingClientRect();
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

// Mute / Unmute Button Logic
muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  muteIcon.innerHTML = audio.muted ? iconMuted : iconUnmuted;
});

// Catalogue Drawer
function initCatalogue() {
  albumChips.innerHTML = '';
  discography.forEach((album, idx) => {
    const chip = document.createElement('button');
    chip.className = `chip-btn ${idx === currentAlbumIndex ? 'active' : ''}`;
    chip.textContent = album.year;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderTracklist(idx);
    });
    albumChips.appendChild(chip);
  });
  renderTracklist(currentAlbumIndex);
}

function renderTracklist(albumIdx = currentAlbumIndex) {
  const album = discography[albumIdx];
  sheetTracklist.innerHTML = '';

  album.tracks.forEach((track, idx) => {
    const isCurrent = albumIdx === currentAlbumIndex && idx === currentTrackIndex;
    const row = document.createElement('div');
    row.className = `sheet-row ${isCurrent ? 'active' : ''}`;
    row.innerHTML = `
      <div class="sheet-row-left">
        <span class="sheet-row-idx">${idx + 1}</span>
        <span class="sheet-row-name">${track.title}</span>
      </div>
      <span class="sheet-row-dur">${track.duration}</span>
    `;

    row.addEventListener('click', () => {
      loadTrack(albumIdx, idx, true);
      closeSheet();
    });

    sheetTracklist.appendChild(row);
  });
}

function openSheet() {
  archiveSheet.classList.add('open');
  sheetOverlay.classList.add('active');
}

function closeSheet() {
  archiveSheet.classList.remove('open');
  sheetOverlay.classList.remove('active');
}

archiveTrigger.addEventListener('click', openSheet);
drawerTrigger.addEventListener('click', openSheet);
closeArchiveBtn.addEventListener('click', closeSheet);
sheetOverlay.addEventListener('click', closeSheet);

// Initial Load
initCatalogue();
loadTrack(0, 0, false);