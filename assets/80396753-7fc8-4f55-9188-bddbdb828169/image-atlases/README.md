# Lossless image atlases

Generated small images for feature hierarchy, input-size examples and Grad-CAM are grouped by sample/use. `index.json` preserves each original logical image path and gives its sheet and exact pixel rectangle. These logical paths need not exist as separate files: module `AtlasImage` resolves them to an SVG crop; `atlasCropUrl` supplies native-size pixels to Canvas/WebGL.

Regeneration: first run the existing source asset-generation scripts, then run:

```powershell
python modules/Visual-Feature-Learning/services/pack_image_atlases.py --remove-originals
```

The packer checks every cropped pixel against the originals before removing them. Sheets use lossless WebP. Source MNIST files, full-size photos, raw feature tensors and model files are unchanged.
