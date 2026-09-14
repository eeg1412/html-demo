import {HERO_ASSETS} from './hero-assets.js?v=13';
import {MONSTER_DEATH_ART} from './monster-death-art.js?v=18';

// Shared atlas contains the portal used by both maps (also candy props).
export const GLOBAL_ASSETS=['assets/hero.webp',...Object.values(HERO_ASSETS).map(s=>s.url),'assets/candy-objects-v15.webp'];
export const MAP_ASSETS={
  meadow:['assets/objects.webp','assets/forest-far-v7.webp','assets/trees-v6.webp','assets/foliage-v6.webp','assets/ground-v11.webp',MONSTER_DEATH_ART.meadow.url],
  candy:['assets/candy-far-v16.webp','assets/candy-scenery-v16.webp','assets/candy-monster-v15.webp','assets/candy-ground-v15.webp',MONSTER_DEATH_ART.candy.url]
};
