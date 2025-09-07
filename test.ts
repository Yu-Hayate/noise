// Example usage:
let rng = Random.createRNG(12345);
Noise.setSeed(rng);

// Create river noise
let riverMap = Noise.createNoiseMap(NoiseType.River, 160, 120, 4);

// Convert to image to visualize
let riverImage = Noise.noiseToImage(riverMap);
scene.setBackgroundImage(riverImage);

pause(1000);

// Create base terrain
let baseNoise = Noise.createNoiseMap(NoiseType.Terrain, 160, 120, 4);

// Create river network
let riverNoise = Noise.createNoiseMap(NoiseType.Static, 160, 120, 1);

// Combine them (rivers cut through terrain)
let combinedNoise = Noise.combineNoiseMaps(baseNoise, riverNoise, 2); // 4 = min operation

// Visualize
let terrainImage = Noise.noiseToImage(combinedNoise);

scene.setBackgroundImage(terrainImage);