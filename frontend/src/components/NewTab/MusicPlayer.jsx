import {
  Heart,
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useBrowser } from "../../context/BrowserContext";
import { useCallback, useEffect, useRef, useState } from "react";

const TRACKS = [
  {
    id: "track-1",
    title: "Lofi Hip Hop Radio",
    artist: "Lofi Girl",
    videoId: "jfKfPfyJRdk",
  },
  {
    id: "track-2",
    title: "Chillhop Radio",
    artist: "Chillhop Music",
    videoId: "5yx6BWlEVcY",
  },
  {
    id: "track-3",
    title: "Coffee Shop Radio",
    artist: "Lofi Girl",
    videoId: "lP26UCnoH9s",
  },
];

let youtubeApiPromise = null;

function loadYouTubePlayerApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();

      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube Player API did not initialize."));
      }
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    script.onerror = () => {
      reject(new Error("Unable to load YouTube Player API."));
    };

    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function formatTime(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function MusicPlayer({ styles }) {
  const { navigate } = useBrowser();
  const playerElementRef = useRef(null);
  const playerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTrack = TRACKS[trackIndex];

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressTimer = useCallback(() => {
    stopProgressTimer();

    progressTimerRef.current = window.setInterval(() => {
      const player = playerRef.current;

      if (!player?.getCurrentTime) {
        return;
      }

      const nextCurrentTime = player.getCurrentTime();
      const nextDuration = player.getDuration();

      setCurrentTime(Number.isFinite(nextCurrentTime) ? nextCurrentTime : 0);

      setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
    }, 500);
  }, [stopProgressTimer]);

  const playTrackAtIndex = useCallback((nextIndex, autoplay = true) => {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    const safeIndex =
      ((nextIndex % TRACKS.length) + TRACKS.length) % TRACKS.length;

    const nextTrack = TRACKS[safeIndex];

    setTrackIndex(safeIndex);
    setCurrentTime(0);
    setDuration(0);
    setLiked(false);

    if (autoplay) {
      player.loadVideoById(nextTrack.videoId);
    } else {
      player.cueVideoById(nextTrack.videoId);
    }
  }, []);

  const playNext = useCallback(() => {
    if (shuffleEnabled) {
      let nextIndex = trackIndex;

      while (TRACKS.length > 1 && nextIndex === trackIndex) {
        nextIndex = Math.floor(Math.random() * TRACKS.length);
      }

      playTrackAtIndex(nextIndex, true);
      return;
    }

    playTrackAtIndex(trackIndex + 1, true);
  }, [playTrackAtIndex, shuffleEnabled, trackIndex]);

  useEffect(() => {
    let cancelled = false;

    loadYouTubePlayerApi()
      .then((YT) => {
        if (cancelled || !playerElementRef.current) {
          return;
        }

        const state = YT.PlayerState;

        playerRef.current = new YT.Player(playerElementRef.current, {
          width: "200",
          height: "200",
          videoId: TRACKS[0].videoId,

          playerVars: {
            autoplay: 0,
            controls: 0,
            playsinline: 1,
            rel: 0,
          },

          events: {
            onReady: (event) => {
              if (cancelled) {
                return;
              }

              const initialDuration = event.target.getDuration();

              setDuration(
                Number.isFinite(initialDuration) ? initialDuration : 0,
              );

              setReady(true);
              setPlayerError("");
            },

            onStateChange: (event) => {
              if (cancelled) {
                return;
              }

              if (event.data === state.PLAYING) {
                setPlaying(true);
                startProgressTimer();
                return;
              }

              if (event.data === state.PAUSED) {
                setPlaying(false);
                stopProgressTimer();
                return;
              }

              if (event.data === state.ENDED) {
                setPlaying(false);
                stopProgressTimer();

                if (repeatEnabled) {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                } else {
                  playNext();
                }
              }
            },

            onError: () => {
              setPlaying(false);
              setPlayerError("This track could not be played.");
              stopProgressTimer();
            },
          },
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setPlayerError(
            error?.message || "Unable to initialize the music player.",
          );
        }
      });

    return () => {
      cancelled = true;
      stopProgressTimer();

      const player = playerRef.current;
      playerRef.current = null;

      try {
        player?.destroy?.();
      } catch {
        return;
      }
    };
  }, [playNext, repeatEnabled, startProgressTimer, stopProgressTimer]);

  const togglePlayback = () => {
    const player = playerRef.current;

    if (!player || !ready) {
      return;
    }

    if (playing) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const playPrevious = () => {
    const player = playerRef.current;

    if (!player || !ready) {
      return;
    }

    const elapsed = player.getCurrentTime();

    if (elapsed > 5) {
      player.seekTo(0, true);
      return;
    }

    playTrackAtIndex(trackIndex - 1, true);
  };

  const handleSeek = (event) => {
    const player = playerRef.current;

    if (!player || !ready || duration <= 0) {
      return;
    }

    const requestedTime = Number(event.target.value);

    if (!Number.isFinite(requestedTime)) {
      return;
    }

    player.seekTo(requestedTime, true);
    setCurrentTime(requestedTime);
  };

  return (
    <section className={`${styles.panel} ${styles.musicPlayer}`}>
      <header className={styles.panelHeader}>
        <div>
          <Music2 size={19} />
          <h2>YouTube Music Player</h2>
        </div>
      </header>

      <div className={styles.musicContent}>
        <div className={styles.youtubePlayerVisual}>
          <div ref={playerElementRef} className={styles.youtubePlayerElement} />
        </div>

        <div className={styles.trackArea}>
          <div className={styles.trackHeader}>
            <div>
              <h3>{currentTrack.title}</h3>
              <p>{currentTrack.artist}</p>
            </div>

            <div className={styles.trackActions}>
              <button
                type="button"
                className={liked ? styles.likedButton : ""}
                onClick={() => setLiked((current) => !current)}
                aria-label={
                  liked ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Heart size={19} fill={liked ? "currentColor" : "none"} />
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(
                    navigate(
                      `https://music.youtube.com/watch?v=${currentTrack.videoId}`,
                    ),
                  );
                }}
                aria-label="Open on YouTube Music"
                title="Open on YouTube Music"
              >
                <ListMusic size={18} />
              </button>
            </div>
          </div>

          {playerError && (
            <p className={styles.musicError} role="alert">
              {playerError}
            </p>
          )}

          <div className={styles.progressRow}>
            <input
              className={styles.musicSeek}
              type="range"
              min="0"
              max={Math.max(duration, 0)}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              onChange={handleSeek}
              disabled={!ready || duration <= 0}
              aria-label="Track position"
            />

            <small>
              {formatTime(currentTime)} / {formatTime(duration)}
            </small>
          </div>

          <div className={styles.playerControls}>
            <button
              type="button"
              className={shuffleEnabled ? styles.activePlayerControl : ""}
              onClick={() => setShuffleEnabled((current) => !current)}
              aria-label="Toggle shuffle"
              aria-pressed={shuffleEnabled}
            >
              <Shuffle size={17} />
            </button>

            <button
              type="button"
              onClick={playPrevious}
              disabled={!ready}
              aria-label="Previous track"
            >
              <SkipBack size={20} />
            </button>

            <button
              type="button"
              className={styles.playButton}
              onClick={togglePlayback}
              disabled={!ready}
              aria-label={playing ? "Pause track" : "Play track"}
            >
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </button>

            <button
              type="button"
              onClick={playNext}
              disabled={!ready}
              aria-label="Next track"
            >
              <SkipForward size={20} />
            </button>

            <button
              type="button"
              className={repeatEnabled ? styles.activePlayerControl : ""}
              onClick={() => setRepeatEnabled((current) => !current)}
              aria-label="Toggle repeat"
              aria-pressed={repeatEnabled}
            >
              <Repeat2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MusicPlayer;
