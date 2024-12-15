// Asset and sound preloading
const soundCache = new Map();
const assetCache = new Map();

export const preloadAssets = () => {
  const assets = [
    '/game-board.png',
    '/splash.png',
    '/sounds/click.mp3',
    '/sounds/win.mp3',
    '/sounds/lose.mp3',
    '/sounds/draw.mp3'
  ];
  
  assets.forEach(asset => {
    if (asset.endsWith('.mp3')) {
      if (!soundCache.has(asset)) {
        const audio = new Audio(asset);
        soundCache.set(asset, audio);
      }
    } else {
      if (!assetCache.has(asset)) {
        const img = new Image();
        img.src = asset;
        assetCache.set(asset, img);
      }
    }
  });
};

export const playSound = (soundUrl: string) => {
  if (soundCache.has(soundUrl)) {
    const audio = soundCache.get(soundUrl);
    audio.currentTime = 0;
    audio.play();
  }
}; 