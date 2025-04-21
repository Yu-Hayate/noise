enum NoiseType {
    //% block="Perlin"
    Perlin,
    //% block="Static"
    Static
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
     * @param noiseType Type of noise to generate (Perlin or Static).
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
            default:
                return [];
                break
        }
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
        return noise;
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
}