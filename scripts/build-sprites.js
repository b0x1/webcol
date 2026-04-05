import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const TILE_SIZE = 64;
const SPRITE_CACHE_FILE = '.sprite-cache';
const INPUT_ROOT_DIR = path.join('src', 'assets', 'sprites');
const OUTPUT_DIR = 'public';
const CATEGORIES = ['resources', 'terrain', 'units', 'other', 'flags']

async function get_config(type) {
  return {
    inputDir: path.join(INPUT_ROOT_DIR, type),
    hashCacheFile: path.join(INPUT_ROOT_DIR, type, SPRITE_CACHE_FILE),
    outputAvif: path.join(OUTPUT_DIR, `${type}.avif`),
    outputJson: path.join(OUTPUT_DIR, `${type}.json`),
  }
}

const CONFIGS = await Promise.all(
  CATEGORIES.map(key => get_config(key))
);

async function checkCache(inputDir, hashCacheFile) {
  const allFiles = [];
  if (fs.existsSync(inputDir)) {
    const files = fs.readdirSync(inputDir)
      .filter(f => f.endsWith('.svg'))
      .map(f => path.join(inputDir, f));
    allFiles.push(...files);
  }

  // Sort by full path for determinism
  allFiles.sort();

  const hash = crypto.createHash('sha256');
  for (const file of allFiles) {
    // Include relative path in hash so renames/moves trigger rebuild
    hash.update(path.relative(inputDir, file));
    hash.update(fs.readFileSync(file));
  }

  const currentHash = hash.digest('hex');
  var cached = false;
  if (fs.existsSync(hashCacheFile)) {
    const cachedHash = fs.readFileSync(hashCacheFile, 'utf8').trim();
    cached = cachedHash === currentHash;
  }

  return {
    cached,
    currentHash
  };
}

async function buildSpritesheet(config) {
  const { inputDir, hashCacheFile, outputAvif, outputJson } = config;
  if (!fs.existsSync(inputDir)) {
    console.warn(`Input directory ${inputDir} does not exist, skipping.`);
    return;
  }

  const files = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('.svg'))
    .sort();

  if (files.length === 0) {
    console.warn(`No SVG files found in ${inputDir}, skipping.`);
    return;
  }

  const {cached, currentHash} = await checkCache(inputDir, hashCacheFile);
  if (cached) {
    console.log(`SVGs in ${inputDir} are cached. Skip creating images.`);
    return;
  }

  const count = files.length;
  // Calculate grid dimensions for a square-ish layout
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const width = cols * TILE_SIZE;
  const height = rows * TILE_SIZE;

  const composites = [];
  const jsonMap = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = path.parse(file).name;
    const x = (i % cols) * TILE_SIZE;
    const y = Math.floor(i / cols) * TILE_SIZE;

    const svgBuffer = fs.readFileSync(path.join(inputDir, file));

    // Use sharp to rasterize SVG to AVIF buffer
    const avifBuffer = await sharp(svgBuffer, { density: 96 })
      .resize(TILE_SIZE, TILE_SIZE)
      .avif({ quality: 80, effort: 9 })
      .toBuffer();

    composites.push({
      input: avifBuffer,
      top: y,
      left: x,
    });

    jsonMap[name] = { x, y, w: TILE_SIZE, h: TILE_SIZE };
  }

  // Ensure output directories exist
  fs.mkdirSync(path.dirname(outputAvif), { recursive: true });
  fs.mkdirSync(path.dirname(outputJson), { recursive: true });

  // Create base image and composite the tiles
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .avif({ quality: 80 })
    .toFile(outputAvif);

  fs.writeFileSync(outputJson, JSON.stringify(jsonMap, null, 2));
  console.log(`Generated ${outputAvif} and ${outputJson}`);

  fs.writeFileSync(hashCacheFile, currentHash);
  console.log(`Update cache file ${hashCacheFile}`);
}

async function run() {
  console.log('Building sprites...');
  for (const config of CONFIGS) {
    await buildSpritesheet(config);
  }
  console.log('Sprites built successfully.');
}

run().catch(err => {
  console.error('Error building sprites:', err);
  process.exit(1);
});
