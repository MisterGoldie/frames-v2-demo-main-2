// Asset and sound preloading
const soundCache = new Map();
const assetCache = new Map();

export const preloadAssets = async () => {
  const assets = [
    // PNG assets
    '/scarygary.png',
    '/chili.png',
    '/podplaylogo.png',
    '/fantokenlogo.png',
    '/game-board.png',
    '/splash.png',
    '/maxi.png',
    // Sound assets
    '/sounds/click.mp3',
    '/sounds/winning.mp3',
    '/sounds/losing.mp3',
    '/sounds/drawing.mp3',
    '/sounds/jingle.mp3',
    '/sounds/hover.mp3',
    '/sounds/choose.mp3',
    '/sounds/countdown.mp3',
    '/sounds/openingtheme.mp3'
  ];
  
  const loadPromises = assets.map(asset => {
    // Skip audio preloading on mobile
    if (asset.endsWith('.mp3')) {
      return Promise.resolve();
    }

    // Only preload images
    if (!assetCache.has(asset)) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          assetCache.set(asset, img);
          resolve(img);
        };
        img.onerror = () => {
          // Don't fail on image load error
          console.warn(`Failed to load asset: ${asset}`);
          resolve(null);
        };
        img.src = asset;
      });
    }
    return Promise.resolve(); // Asset already cached
  });

  await Promise.all(loadPromises);
};

export const playSound = (soundUrl: string) => {
  if (soundCache.has(soundUrl)) {
    const audio = soundCache.get(soundUrl);
    audio.currentTime = 0;
    audio.play();
  }
}; 