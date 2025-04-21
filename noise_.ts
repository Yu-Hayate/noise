enum NoiseType {
    //% block="Perlin"
    Perlin,
    //% block="Static"
    Static,
    //% block="Ridged"
    Ridged,
    //% block="Terrain"
    Terrain,
    //% block="River"
    River
}
let nodes: number = 12
let gradients: { x: number; y: number }[][] = [];
let currentRng: FastRandomBlocks = Random.createRNG(Math.randomRange(0x00000001, 0xFFFFFFFF));

//% color="#556B2F"
namespace Noise {
    /**
     * Sets the random number generator for noise generation
     * @param rng The FastRandomBlocks instance to use for seeded randomness
     */
    //% block="set noise seed to $rng"
    //% rng.defl=rng
    //% rng.shadow=variables_get
    export function setSeed(rng: FastRandomBlocks) {
        currentRng = rng;
    }

    /**
     * Generates a noise map based on the specified noise type.
     * @param noiseType Type of noise to generate (Perlin, Static, Ridged, Terrain, or River).
     * @param width The width of the noise map.
     * @param height The height of the noise map.
     * @returns A 2D array representing the generated noise map.
     */
    //% block="create $noiseType noise map width $width height $height || scale $scale "
    //% blockSetVariable=noiseMap
    //% width.defl=160
    //% height.defl=120
    //% scale.defl=4
    //% inlineInputMode=inline
    export function createNoiseMap(noiseType: NoiseType, width: number, height: number, scale?: number): number[][] {
        // Make sure we have an RNG - if not, create a default one
        if (!currentRng) {
            currentRng = new FastRandomBlocks(1234); // Default seed
        }

        switch (noiseType) {
            case NoiseType.Perlin:
                nodes = scale || 4;
                initialize_gradients();
                return generate_perlin_noise(width, height);
                break;
            case NoiseType.Static:
                return generate_static_noise(width, height);
                break;
            case NoiseType.Ridged:
                nodes = scale || 4;
                initialize_gradients();
                return generate_ridged_noise(width, height);
                break;
            case NoiseType.Terrain:
                nodes = scale || 4;
                initialize_gradients();
                return generate_terrain_noise(width, height);
                break;
            case NoiseType.River:
                nodes = scale || 4;
                initialize_gradients();
                return generate_river_noise(width, height);
                break;
            default:
                return [];
                break
        }
    }

    /**
     * Create a combined noise map using multiple noise types and parameters.
     * @param width The width of the noise map
     * @param height The height of the noise map
     * @param layers Number of noise layers to combine (more = more detail but slower)
     */
    //% block="create layered noise map width $width height $height layers $layers || scale $scale persistence $persistence"
    //% blockSetVariable=noiseMap
    //% width.defl=160
    //% height.defl=120
    //% layers.defl=3
    //% scale.defl=4
    //% persistence.defl=0.5
    //% inlineInputMode=inline
    export function createLayeredNoiseMap(width: number, height: number, layers: number, scale?: number, persistence?: number): number[][] {
        // Make sure we have an RNG - if not, create a default one
        if (!currentRng) {
            currentRng = new FastRandomBlocks(1234);
        }

        nodes = scale || 4;
        let persistenceValue = persistence || 0.5;

        let noiseMap: number[][] = [];
        // Initialize noiseMap with zeros
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(0);
            }
            noiseMap.push(row);
        }

        let amplitude = 1;
        let totalAmplitude = 0;

        // Add multiple layers of noise at different frequencies
        for (let i = 0; i < layers; i++) {
            // Create a new gradient field for this layer
            initialize_gradients();

            // The frequency increases with each layer
            let frequency = Math.pow(2, i);
            let layerNodes = nodes * frequency;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    // Calculate perlin noise for this point
                    let noiseValue = perlin_get((x / width) * layerNodes, (y / height) * layerNodes);
                    // Add weighted noise to the total
                    noiseMap[y][x] += noiseValue * amplitude;
                }
            }

            totalAmplitude += amplitude;
            amplitude *= persistenceValue; // Decrease amplitude for next layer
        }

        // Normalize to 0-1 range
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                noiseMap[y][x] /= totalAmplitude;
            }
        }

        return noiseMap;
    }

    /**
     * Converts a noise map into an image and sets it as the background.
     * @param noiseMap A 2D array representing the noise map to be visualized.
     */
    //% block="convert $noiseMap to image"
    //% noiseMap.defl=noiseMap
    //% noiseMap.shadow=variables_get
    export function noiseToImage(noiseMap: number[][]): Image {
        const h: number = noiseMap.length; // Height of the noise map
        const w: number = noiseMap[0].length; // Width of the noise map
        let noise: Image = image.create(w, h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let color = Math.floor(noiseMap[y][x] * 15) + 1; // Map to color range
                noise.setPixel(x, y, color);
            }
        }
        return noise.clone();
    }

    /**
     * Apply a threshold to a noise map to create binary terrain
     * @param noiseMap The noise map to threshold
     * @param threshold Value between 0-1 where values above become 1, below become 0
     */
    //% block="threshold $noiseMap at $threshold"
    //% noiseMap.defl=noiseMap
    //% noiseMap.shadow=variables_get
    //% threshold.defl=0.5
    //% threshold.min=0 threshold.max=1
    export function thresholdNoiseMap(noiseMap: number[][], threshold: number): number[][] {
        const h: number = noiseMap.length;
        const w: number = noiseMap[0].length;
        let result: number[][] = [];

        for (let y = 0; y < h; y++) {
            let row = [];
            for (let x = 0; x < w; x++) {
                row.push(noiseMap[y][x] > threshold ? 1 : 0);
            }
            result.push(row);
        }

        return result;
    }

    // Helper function that uses the seeded RNG instead of Math.random()
    export function seeded_random(): number {
        // Get a number between 0 and 65535, then normalize to 0-1
        return currentRng.nextNumber() / 65535;
    }

    export function random_unit_vector() {
        let theta = seeded_random() * 2 * Math.PI;
        return { x: Math.cos(theta), y: Math.sin(theta) };
    }

    export function initialize_gradients() {
        gradients = [];
        for (let i = 0; i < nodes; i++) {
            let row = [];
            for (let j = 0; j < nodes; j++) {
                row.push(random_unit_vector());
            }
            gradients.push(row);
        }
    }

    export function dot_prod_grid(x: number, y: number, vert_x: number, vert_y: number): number {
        let g_vect = gradients[vert_y][vert_x];
        let d_vect = { x: x - vert_x, y: y - vert_y };
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    }

    export function smootherstep(x: number): number {
        return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
    }

    export function interp(x: number, a: number, b: number): number {
        return a + smootherstep(x) * (b - a);
    }

    export function perlin_get(x: number, y: number): number {
        let x0 = Math.floor(x);
        let x1 = x0 + 1;
        let y0 = Math.floor(y);
        let y1 = y0 + 1;

        let sx = x - x0;
        let sy = y - y0;

        let n0 = dot_prod_grid(x, y, x0, y0);
        let n1 = dot_prod_grid(x, y, x1, y0);
        let ix0 = interp(sx, n0, n1);

        n0 = dot_prod_grid(x, y, x0, y1);
        n1 = dot_prod_grid(x, y, x1, y1);
        let ix1 = interp(sx, n0, n1);

        return (interp(sy, ix0, ix1) + 1) / 2;
    }

    export function generate_perlin_noise(width: number, height: number): number[][] {
        let noise: number[][] = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(perlin_get(x / width * (nodes - 1), y / height * (nodes - 1)));
            }
            noise.push(row);
        }
        return noise;
    }

    export function generate_static_noise(width: number, height: number): number[][] {
        const noise: number[][] = [];

        for (let y = 0; y < height; y++) {
            const row: number[] = [];
            for (let x = 0; x < width; x++) {
                // Use seeded random instead of Math.random()
                const randomValue = seeded_random();
                row.push(randomValue);
            }
            noise.push(row);
        }

        return noise;
    }

    // NEW NOISE FUNCTIONS

    // Creates ridged noise - inverts peaks to make sharp ridges
    export function generate_ridged_noise(width: number, height: number): number[][] {
        let noise: number[][] = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                // Get perlin noise value
                let value = perlin_get(x / width * (nodes - 1), y / height * (nodes - 1));
                // Invert the peaks to make sharp ridges
                value = 1 - Math.abs(2 * value - 1);
                row.push(value);
            }
            noise.push(row);
        }
        return noise;
    }

    // Creates terrain-like noise with plateaus and steep cliffs
    export function generate_terrain_noise(width: number, height: number): number[][] {
        let noise: number[][] = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                // Get perlin noise value
                let value = perlin_get(x / width * (nodes - 1), y / height * (nodes - 1));
                // Apply curve to emphasize high areas (plateaus) and exaggerate slopes
                value = Math.pow(value, 1.5); // Adjust power for different terrain styles
                row.push(value);
            }
            noise.push(row);
        }
        return noise;
    }

    // Creates river-like noise with thin low areas and large high areas
    export function generate_river_noise(width: number, height: number): number[][] {
        let ridged = generate_ridged_noise(width, height);
        let river: number[][] = [];

        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                // Invert ridged noise to make valleys
                let value = 1 - ridged[y][x];
                row.push(value);
            }
            river.push(row);
        }

        return river;
    }



    /**
     * Combine two noise maps to create interesting terrain features
     * @param noiseMap1 The first noise map
     * @param noiseMap2 The second noise map
     * @param operation The operation to perform (0=multiply, 1=add, 2=subtract, 3=max, 4=min)
     */
    //% block="combine $noiseMap1 with $noiseMap2 using $operation"
    //% noiseMap1.defl=noiseMap1
    //% noiseMap1.shadow=variables_get
    //% noiseMap2.defl=noiseMap2
    //% noiseMap2.shadow=variables_get
    //% operation.defl=0
    export function combineNoiseMaps(noiseMap1: number[][], noiseMap2: number[][], operation: number): number[][] {
        const h = Math.min(noiseMap1.length, noiseMap2.length);
        const w = Math.min(noiseMap1[0].length, noiseMap2[0].length);
        let result: number[][] = [];

        for (let y = 0; y < h; y++) {
            let row = [];
            for (let x = 0; x < w; x++) {
                let val1 = noiseMap1[y][x];
                let val2 = noiseMap2[y][x];
                let combinedValue = 0;

                switch (operation) {
                    case 0: // Multiply
                        combinedValue = val1 * val2;
                        break;
                    case 1: // Add
                        combinedValue = (val1 + val2) / 2; // Normalize to 0-1
                        break;
                    case 2: // Subtract
                        combinedValue = Math.max(0, Math.min(1, val1 - val2 + 0.5)); // Normalize to 0-1
                        break;
                    case 3: // Max
                        combinedValue = Math.max(val1, val2);
                        break;
                    case 4: // Min
                        combinedValue = Math.min(val1, val2);
                        break;
                    default:
                        combinedValue = val1;
                }

                row.push(combinedValue);
            }
            result.push(row);
        }

        return result;
    }

    /**
     * Inverts a 2D noise map. Each value `v` becomes `1 - v`.
     * Useful for transforming ridged noise into valleys (e.g. riverbeds).
     * 
     * @param noise The 2D noise map to invert
     * @returns A new 2D array where each value is inverted
     */
    //% block="Invert noise map"
    //% group="Noise Utils"
    export function invert_noise(noise: number[][]): number[][] {
        let height = noise.length;
        let width = noise[0].length;
        let result: number[][] = [];

        for (let y = 0; y < height; y++) {
            let row: number[] = [];
            for (let x = 0; x < width; x++) {
                row.push(1 - noise[y][x]);
            }
            result.push(row);
        }

        return result;
    }

}