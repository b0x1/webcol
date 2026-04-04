import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const TILE_SIZE = 64;
const SPRITE_CACHE_FILE = path.join('src', 'assets', 'sprites', '.sprite-cache');
const INPUT_ROOT_DIR = path.join('src', 'assets', 'sprites');
const OUTPUT_DIR = 'public';

const CATEGORIES = ['resources', 'terrain', 'units', 'other'];

async function get_config(type) {
  return {
    type,
    inputDir: path.join(INPUT_ROOT_DIR, type),
    outputAvif: path.join(OUTPUT_DIR, `${type}.avif`),
    outputJson: path.join(OUTPUT_DIR, `${type}.json`),
  };
}

const CONFIGS = await Promise.all(
  CATEGORIES.map(key => get_config(key))
);

async function calculateGlobalHash() {
  const hash = crypto.createHash('sha256');
  const allSvgFiles = [];

  for (const category of CATEGORIES) {
    const inputDir = path.join(INPUT_ROOT_DIR, category);
    if (fs.existsSync(inputDir)) {
      const files = fs.readdirSync(inputDir)
        .filter(f => f.endsWith('.svg'))
        .map(f => ({
          category,
          name: f,
          fullPath: path.join(inputDir, f)
        }));
      allSvgFiles.push(...files);
    }
  }

  // Sort for determinism
  allSvgFiles.sort((a, b) => a.fullPath.localeCompare(b.fullPath));

  for (const file of allSvgFiles) {
    hash.update(`${file.category}/${file.name}`);
    hash.update(fs.readFileSync(file.fullPath));
  }

  return hash.digest('hex');
}

async function buildSpritesheet(config) {
  const { inputDir, outputAvif, outputJson } = config;
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

  const count = files.length;
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
}

async function run() {
  console.log('Building sprites...');

  const currentHash = await calculateGlobalHash();
  let cached = false;

  if (fs.existsSync(SPRITE_CACHE_FILE)) {
    const cachedHash = fs.readFileSync(SPRITE_CACHE_FILE, 'utf8').trim();
    cached = cachedHash === currentHash;
  }

  if (cached) {
    console.log('SVGs are cached. Skip creating images.');
    return;
  }

  for (const config of CONFIGS) {
    await buildSpritesheet(config);
  }

  fs.writeFileSync(SPRITE_CACHE_FILE, currentHash);
  console.log(`Update cache file ${SPRITE_CACHE_FILE}`);
  console.log('Sprites built successfully.');
}

run().catch(err => {
  console.error('Error building sprites:', err);
  process.exit(1);
});
