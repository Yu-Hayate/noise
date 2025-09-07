let noiseMask = Noise.CreateNoiseMask(MaskType.Checkerboard, 160, 120, 12)
scene.setBackgroundImage(Noise.noiseToImage(noiseMask))
