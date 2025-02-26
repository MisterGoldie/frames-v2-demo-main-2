// Asset and sound preloading
const soundCache = new Map();
const assetCache = new Map();

// Prioritize critical assets first
const CRITICAL_ASSETS = [
  '/podplaylogo.png',
  '/game-board.png',
  '/sounds/openingtheme.mp3',
  '/sounds/jingle.mp3'
];

// Secondary assets loaded after critical ones
const SECONDARY_ASSETS = [
  '/scarygary.png',
  '/chili.png',
  '/fantokenlogo.png',
  '/splash.png',
  '/maxi.png',
  '/sounds/click.mp3',
  '/sounds/winning.mp3',
  '/sounds/losing.mp3',
  '/sounds/drawing.mp3',
  '/sounds/hover.mp3',
  '/sounds/choose.mp3',
  '/sounds/countdown.mp3'
];

export const preloadAssets = async () => {
  // Load critical assets first
  await Promise.all(
    CRITICAL_ASSETS.map(loadAsset)
  );

  // Then load secondary assets
  Promise.all(
    SECONDARY_ASSETS.map(loadAsset)
  ).catch(console.warn); // Don't block on secondary assets
};

const loadAsset = async (asset: string) => {
  try {
    if (asset.endsWith('.mp3')) {
      if (!soundCache.has(asset)) {
        const audio = new Audio(asset);
        soundCache.set(asset, audio);
        // Start loading but don't play
        audio.load();
      }
      return;
    }

    if (!assetCache.has(asset)) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          console.warn(`Failed to load asset: ${asset}`);
          resolve(null);
        };
        img.src = asset;
      });
      assetCache.set(asset, img);
    }
  } catch (error) {
    console.warn(`Error loading asset ${asset}:`, error);
  }
};

// Utility to get preloaded assets
export const getPreloadedAsset = (asset: string) => {
  if (asset.endsWith('.mp3')) {
    return soundCache.get(asset);
  }
  return assetCache.get(asset);
};

// Clear caches when needed (e.g., low memory)
export const clearAssetCaches = () => {
  soundCache.clear();
  assetCache.clear();
};



export const playSound = (soundUrl: string) => {
  if (soundCache.has(soundUrl)) {
    const audio = soundCache.get(soundUrl);
    audio.currentTime = 0;
    audio.play();
  }
}; 