# Training-photo sources

24 course-owner-provided photos remain under their original ownership.

276 additional photos were selected from **TrashNet**, collected by **Gary Thung and Mindy Yang**.
Original project: https://github.com/garythung/trashnet
Author-hosted dataset: https://huggingface.co/datasets/garythung/trashnet
Pinned archive: https://huggingface.co/datasets/garythung/trashnet/resolve/94cd17e/dataset-resized.zip

TrashNet is published under the MIT license; the full notice is preserved in TRASHNET-LICENSE.txt. Each entry in dataset.json preserves the original archive member, SHA256, group and split. Only visually reviewed plastic bottles, beverage cans and cardboard boxes/flattened cartons were included; plastic trays, loose caps, foil, food tins and ambiguous material close-ups were excluded. The source photos are 512×384; original JPEG bytes are retained. No augmented copy counts as a new photo.

There are 100 photos per class: 60 train, 20 validation, 20 test (180/60/60 overall). Related views of matching bottles, cans and cartons stay in one split. The reviewed source numbers and groups are recorded in scripts/resnet_head_photo_selection.json. This is a small teaching dataset, not 300 independent objects: several objects have multiple original views. The public-source photos mostly use clean backgrounds, so test accuracy does not establish performance in real bins or cluttered scenes. The split was fixed before the expanded dataset was trained or tested; test scores do not select epochs or training settings.
