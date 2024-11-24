let youtubePlayer;
let currentTrack = null;
let playlist = [];

function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('youtubePlayer', {
        height: '360',
        width: '640',
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'rel': 0,
            'fs': 1,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        event.target.setVolume(volumeSlider.value);
    }
}

function onPlayerStateChange(event) {
    const playBtn = document.getElementById('playBtn');
    if (event.data === YT.PlayerState.PLAYING) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (!window.progressInterval) {
            window.progressInterval = setInterval(updateTimeDisplay, 1000);
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else if (event.data === YT.PlayerState.ENDED) {
        playNext();
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    alert('Error playing YouTube video. Please try another video.');
}

document.getElementById('loadYoutube').addEventListener('click', async () => {
    const input = document.getElementById('youtubeInput').value.trim();
    if (!input) return;

    let videoId = '';
    if (input.includes('youtube.com/watch?v=')) {
        videoId = input.split('v=')[1].split('&')[0];
    } else if (input.includes('youtu.be/')) {
        videoId = input.split('youtu.be/')[1].split('?')[0];
    } else if (input.match(/^[a-zA-Z0-9_-]{11}$/)) {
        videoId = input;
    }

    if (!videoId) {
        alert('Invalid YouTube URL');
        return;
    }

    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await response.json();
        
        const track = {
            type: 'youtube',
            id: videoId,
            title: data.title || 'Unknown Title',
            artist: data.author_name || 'Unknown Artist',
            url: `https://www.youtube.com/watch?v=${videoId}`,
            isVideo: true
        };

        if (currentTrack) {
            stopCurrentTrack();
        }
        
        addToPlaylist(track);
        playTrack(track);
    } catch (error) {
        console.error('Error loading YouTube video:', error);
        alert('Error loading YouTube video');
    }
});


document.getElementById('localFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const fileType = file.type.toLowerCase();
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    
    const isVideo = fileType.startsWith('video/') || /\.(mov|mp4)$/i.test(file.name);
    const isAudio = fileType.startsWith('audio/') || /\.mp3$/i.test(file.name);

    if (!isVideo && !isAudio) {
        alert('Unsupported file type. Please upload an audio (MP3) or video (MP4, MOV) file.');
        URL.revokeObjectURL(url);
        return;
    }

    if (currentTrack) {
        stopCurrentTrack();
    }

    const track = {
        type: 'local',
        url: url,
        title: fileName,
        artist: 'Local Media',
        isVideo: isVideo,
        file: file
    };

    addToPlaylist(track);
    
    await playTrack(track);
});

function addToPlaylist(track) {
    playlist = playlist.filter(t => t.url !== track.url);
    playlist.unshift(track);
    if (playlist.length > 50) playlist.pop();
    updateHistory();
}

function updateHistory() {
    const historyList = document.getElementById('history');
    const clearBtn = document.getElementById('clearHistory');
    const emptyHistory = document.querySelector('.empty-history');

    historyList.innerHTML = '';

    if (playlist.length === 0) {
        clearBtn.classList.remove('visible');
        emptyHistory.classList.add('visible');
        return;
    }

    clearBtn.classList.add('visible');
    emptyHistory.classList.remove('visible');

    playlist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        if (currentTrack && track.url === currentTrack.url) {
            item.classList.add('active');
        }

        const title = document.createElement('div');
        title.className = 'history-title';
        title.textContent = track.title;

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';

        downloadBtn.onclick = (e) => {
            e.stopPropagation();
            downloadTrack(index);
        };

        item.onclick = () => playTrack(track);
        item.appendChild(title);
        item.appendChild(downloadBtn);
        historyList.appendChild(item);
    });
}

function updateHistoryHighlight(track) {

    document.querySelectorAll('.history-item').forEach(item => {
        item.classList.remove('active');
    });

    if (track) {
        const historyItems = document.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            const titleEl = item.querySelector('.history-title');
            if (titleEl && titleEl.textContent === track.title) {
                item.classList.add('active');
            }
        });
    }
}

function clearHistory() {
    playlist = [];
    updateHistory();
    localStorage.removeItem('playlist');
}


function playTrack(track) {
    if (!track) return;
    

    if (currentTrack) {
        stopCurrentTrack();
    }
    
    currentTrack = track;
    const localPlayer = document.getElementById('localPlayer');
    const youtubePlayerDiv = document.getElementById('youtubePlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    const songCover = document.getElementById('songCover');
    const songInfo = document.querySelector('.song-info');
    const mediaDetails = document.querySelector('.media-details');
    const songDetails = document.querySelector('.song-details');

    localPlayer.classList.add('hidden');
    youtubePlayerDiv.classList.add('hidden');
    videoPlayer.classList.add('hidden');
    songCover.classList.add('hidden');

    videoPlayer.src = '';
    audioPlayer.src = '';
    
    document.getElementById('songTitle').textContent = track.title;
    document.getElementById('songArtist').textContent = track.artist;

    if (track.type === 'local') {
        localPlayer.classList.remove('hidden');
        
        if (track.file && !track.url) {
            track.url = URL.createObjectURL(track.file);
        }
        
        if (track.isVideo) {
            songInfo.classList.add('video-mode');
            songDetails.classList.add('video-mode');
            mediaDetails.classList.add('video-mode');
            
            videoPlayer.classList.remove('hidden');
            videoPlayer.src = track.url;
            videoPlayer.load();
            videoPlayer.play().catch(error => {
                console.error('Error playing video:', error);
            });
        } else {
            songInfo.classList.remove('video-mode');
            songDetails.classList.remove('video-mode');
            mediaDetails.classList.remove('video-mode');
            
            songCover.classList.remove('hidden');
            songCover.src = 'js/images/cover.jpg';
            
            audioPlayer.src = track.url;
            audioPlayer.load();
            audioPlayer.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        }
        
        setupMediaListeners(track.isVideo ? videoPlayer : audioPlayer);
        
        if (!window.progressInterval) {
            window.progressInterval = setInterval(updateTimeDisplay, 1000);
        }
        
        if (youtubePlayer) {
            youtubePlayer.stopVideo();
        }
    } else if (track.type === 'youtube') {
        youtubePlayerDiv.classList.remove('hidden');
        if (youtubePlayer) {
            youtubePlayer.loadVideoById(track.id);
        }
    }
    
    updateHistoryHighlight(track);
    updatePlayButton();
}

function stopCurrentTrack() {
    if (!currentTrack) return;

    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }

    const videoPlayer = document.getElementById('videoPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = '';
        videoPlayer.load();
    }
    
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
        audioPlayer.load();
    }
    
    if (youtubePlayer) {
        youtubePlayer.stopVideo();
    }

    const progress = document.querySelector('.progress');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    
    if (progress) progress.style.width = '0%';
    if (currentTimeEl) currentTimeEl.textContent = '0:00';
    if (durationEl) durationEl.textContent = '0:00';

    if (currentTrack.type === 'local' && currentTrack.url) {
        URL.revokeObjectURL(currentTrack.url);
    }
}

function togglePlay() {
    if (!currentTrack) return;

    if (currentTrack.type === 'youtube') {
        if (youtubePlayer && youtubePlayer.getPlayerState) {
            const state = youtubePlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                youtubePlayer.pauseVideo();
            } else {
                youtubePlayer.playVideo();
            }
        }
    } else {
        const player = currentTrack.isVideo ? 
            document.getElementById('videoPlayer') : 
            document.getElementById('audioPlayer');
        
        if (player.paused) {
            player.play();
            document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            player.pause();
            document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>';
        }
    }
}

function playNext() {
    const currentIndex = playlist.findIndex(track => track === currentTrack);
    if (currentIndex < playlist.length - 1) {
        playTrack(playlist[currentIndex + 1]);
    }
}

function playPrevious() {
    const currentIndex = playlist.findIndex(track => track === currentTrack);
    if (currentIndex > 0) {
        playTrack(playlist[currentIndex - 1]);
    }
}

const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';

themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', newTheme);
    
    themeIcon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
});

const progressBar = document.querySelector('.progress-bar');
const progress = document.querySelector('.progress');
let isDragging = false;

progressBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateProgress(e);
    document.addEventListener('mousemove', updateProgress);
    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.removeEventListener('mousemove', updateProgress);
    });
});

function updateProgress(e) {
    if (!isDragging && e.type === 'mousemove') return;
    const progressBar = document.querySelector('.progress-bar');
    const progress = document.querySelector('.progress');
    
    if (!progressBar || !progress) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    
    if (currentTrack) {
        if (currentTrack.type === 'youtube' && youtubePlayer) {
            const duration = youtubePlayer.getDuration();
            youtubePlayer.seekTo(duration * clickPosition, true);
        } else if (currentTrack.type === 'local') {
            const player = currentTrack.isVideo ? document.getElementById('videoPlayer') : document.getElementById('audioPlayer');
            if (player && !isNaN(player.duration)) {
                player.currentTime = player.duration * clickPosition;
            }
        }
    }
}

function updateTimeDisplay() {
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const progress = document.querySelector('.progress');
    
    if (!currentTimeEl || !durationEl || !progress) return;

    let currentTime = 0;
    let duration = 0;
    let progressWidth = '0%';

    if (currentTrack) {
        if (currentTrack.type === 'youtube' && youtubePlayer) {
            currentTime = youtubePlayer.getCurrentTime();
            duration = youtubePlayer.getDuration();
            if (duration > 0) {
                progressWidth = (currentTime / duration * 100) + '%';
            }
        } else if (currentTrack.type === 'local') {
            const player = currentTrack.isVideo ? document.getElementById('videoPlayer') : document.getElementById('audioPlayer');
            if (player && !isNaN(player.duration)) {
                currentTime = player.currentTime;
                duration = player.duration;
                progressWidth = (currentTime / duration * 100) + '%';
            }
        }
    }

    currentTimeEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
    progress.style.width = progressWidth;
}

function downloadTrack(index) {
    const track = playlist[index];
    if (!track) return;

    if (track.type === 'local' && track.file) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(track.file);
        a.download = track.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    } else if (track.type === 'youtube') {
        window.location.href = 'youtube_tos.html';
    }
}

const volumeIcon = document.querySelector('.volume-icon');
const volumeSlider = document.querySelector('.volume-slider-container');
const volumeProgress = document.querySelector('.volume-slider-progress');
let prevVolume = 1;
let isDraggingVolume = false;

volumeIcon.addEventListener('click', () => {
    const isMuted = volumeProgress.style.width === '0%';
    if (isMuted) {
        setVolume(prevVolume);
        volumeIcon.className = 'fas fa-volume-up volume-icon';
    } else {
        prevVolume = getCurrentVolume();
        setVolume(0);
        volumeIcon.className = 'fas fa-volume-mute volume-icon';
    }
});

volumeSlider.addEventListener('mousedown', (e) => {
    isDraggingVolume = true;
    updateVolume(e);
    document.addEventListener('mousemove', updateVolume);
    document.addEventListener('mouseup', () => {
        isDraggingVolume = false;
        document.removeEventListener('mousemove', updateVolume);
    });
});

function updateVolume(e) {
    if (!isDraggingVolume && e.type === 'mousemove') return;
    const rect = volumeSlider.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
    setVolume(percent);
}

function setVolume(volume) {
    volumeProgress.style.width = `${volume * 100}%`;
    if (youtubePlayer && youtubePlayer.setVolume) {
        youtubePlayer.setVolume(volume * 100);
    }
    if (audioPlayer) {
        audioPlayer.volume = volume;
    }
    if (videoPlayer) {
        videoPlayer.volume = volume;
    }
    
    volumeIcon.className = `fas ${volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'} volume-icon`;
}

function getCurrentVolume() {
    const width = volumeProgress.style.width;
    return parseFloat(width) / 100 || 1;
}

function toggleFullscreen() {
    if (!currentTrack || (!currentTrack.isVideo && currentTrack.type !== 'youtube')) return;

    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        const element = currentTrack.type === 'youtube' ? 
            document.getElementById('youtubePlayer') : 
            document.getElementById('videoPlayer');
        element.requestFullscreen();
    }
}

function setupMediaListeners(player) {
    if (!player) return;

    player.addEventListener('play', () => {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    });

    player.addEventListener('pause', () => {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    player.addEventListener('ended', () => {
        playNext();
    });

    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', updateProgress);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    
    setupMediaListeners(videoPlayer);
    setupMediaListeners(audioPlayer);
    
    clearHistory();
    
    document.getElementById('playBtn').onclick = togglePlay;
    document.getElementById('nextBtn').onclick = playNext;
    document.getElementById('prevBtn').onclick = playPrevious;
    document.getElementById('fullscreenBtn').onclick = toggleFullscreen;
    
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', (e) => updateVolume(e.target.value));
    
    document.getElementById('clearHistory').addEventListener('click', clearHistory);
});

function updateMediaDisplay(file) {
    const songInfo = document.querySelector('.song-info');
    const mediaDetails = document.querySelector('.media-details');
    const songDetails = document.querySelector('.song-details');
    
    if (file.type.includes('video') || file.name.match(/\.(mp4|mov|webm|avi)$/i)) {
        songInfo.classList.add('video-mode');
        songInfo.classList.remove('audio-mode');
        mediaDetails.classList.add('video-mode');
        mediaDetails.classList.remove('audio-mode');
        songDetails.classList.add('video-mode');
        songDetails.classList.remove('audio-mode');
        displayVideoTitle(file);
    } else {
        songInfo.classList.add('audio-mode');
        songInfo.classList.remove('video-mode');
        mediaDetails.classList.add('audio-mode');
        mediaDetails.classList.remove('video-mode');
        songDetails.classList.add('audio-mode');
        songDetails.classList.remove('video-mode');
    }
}

function updatePlayButton() {
    const playBtn = document.getElementById('playBtn');
    if (currentTrack) {
        playBtn.classList.remove('hidden');
    } else {
        playBtn.classList.add('hidden');
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function displayVideoTitle(file) {
    const videoTitle = document.getElementById('videoTitle');
    if (file && (file.type.includes('video') || file.name.match(/\.(mp4|mov|webm|avi)$/i))) {
        videoTitle.textContent = file.name.replace(/\.[^/.]+$/, '');
        videoTitle.classList.remove('hidden');
    } else {
        videoTitle.classList.add('hidden');
    }
}