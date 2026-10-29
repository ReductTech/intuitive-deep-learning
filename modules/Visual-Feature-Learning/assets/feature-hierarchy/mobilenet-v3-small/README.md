# Real feature hierarchy assets

20 inputs: MNIST digits 0–9 and CIFAR-10 classes, one example per class.
MobileNetV3 Small, torchvision ImageNet IMAGENET1K_V1 pretrained weights, eval mode, no training.

`manifest.json` associates original input, exact preprocessed RGB crop, raw float32 activations and two display channels at each stage. Paths are relative to this directory. Use moduleAssetUrl with the module UUID.

Shallow/middle/deep are features.0/features.3/features.9, not three consecutive single convolution layers. Each transition composes all intervening operations. Channels are selected once by average spatial variance across the full collection and remain fixed for every input. PNG normalization uses a fixed range per stage/channel, with percentile clipping; raw NPZ values are unchanged. Black denotes the low end of that range, not necessarily zero. Resize feature-map previews with nearest-neighbor interpolation.

ImageNet pretraining does not imply digit recognition; do not assign invented edge/part/class labels to particular channels. These are feature responses, not CAM.

Sources: https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.mobilenet_v3_small.html ; https://www.cs.toronto.edu/~kriz/cifar.html ; MNIST inputs reused from this module.

Reproduce with services/prepare_hierarchy_assets.py --cache <download-cache>. Package versions and checkpoint SHA256 are in the manifest.
