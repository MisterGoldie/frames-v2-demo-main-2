// Asset and sound preloading
const soundCache = new Map();
const assetCache = new Map();

// Flag to track if preloading has started
let preloadingStarted = false;

// Prioritize critical assets first
const CRITICAL_ASSETS = [
  // Game pieces (highest priority)
  '/scarygary.png',
  '/chili.png',
  '/mainlogo.png',
  // Core UI
  '/podplaylogo.png',
  '/game-board.png',
  // Critical sounds
  '/sounds/openingtheme.mp3',
  '/sounds/jingle.mp3'
];

// Secondary assets loaded after critical ones
const SECONDARY_ASSETS = [
  '/fantokenlogo.png',
  '/splash.png',
  '/sounds/click.mp3',
  '/sounds/winning.mp3',
  '/sounds/losing.mp3',
  '/sounds/drawing.mp3',
  '/sounds/hover.mp3',
  '/sounds/choose.mp3',
  '/sounds/countdown.mp3'
];

export const preloadAssets = async () => {
  // Prevent duplicate preloading
  if (preloadingStarted) {
    console.log('Asset preloading already in progress, skipping');
    return;
  }
  
  // Set flag to prevent duplicate preloading
  preloadingStarted = true;
  console.log('Starting asset preloading');
  
  try {
    // Load critical assets first
    await Promise.all(
      CRITICAL_ASSETS.map(loadAsset)
    );
    console.log('Critical assets loaded');

    // Then load secondary assets
    Promise.all(
      SECONDARY_ASSETS.map(loadAsset)
    )
    .then(() => console.log('All assets loaded successfully'))
    .catch(error => console.warn('Error loading secondary assets:', error));
  } catch (error) {
    console.error('Error loading critical assets:', error);
    // Reset flag on critical error to allow retry
    preloadingStarted = false;
  }
};

const loadAsset = async (asset: string) => {
  try {
    // Handle audio files
    if (asset.endsWith('.mp3')) {
      // Skip if already cached
      if (soundCache.has(asset)) {
        return;
      }
      
      const audio = new Audio();
      
      // Prevent autoplay
      audio.autoplay = false;
      audio.preload = 'metadata'; // Only load metadata initially
      audio.volume = 0; // Start with volume at 0 to prevent any sound leakage
      
      // Cache the audio element before loading
      soundCache.set(asset, audio);
      
      // Set source and load without playing
      audio.src = asset;
      audio.load();
      
      return;
    }
    
    // Handle image files
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

// Add proper image preloading
export const preloadImages = () => {
  const images = [
    '/scarygary.png',
    '/mainlogo.png', 
    '/game-board.png',
    '/podplaylogo.png',
    '/chili.png',
    '/fantokenlogo.png'
  ];
  
  images.forEach(src => {
    const img = new Image();
    img.onload = () => console.log(`Preloaded: ${src}`);
    img.onerror = (e) => console.error(`Failed to preload: ${src}`, e);
    img.src = src;
  });
};