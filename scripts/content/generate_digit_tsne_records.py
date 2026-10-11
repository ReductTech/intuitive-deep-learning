"""Pretrain the nine fixed-epoch MNIST recordings; resume completed experiments."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend/src"))
from idl_backend.contracts.digit_tsne import BATCH_SIZES, COURSE_ID, EPOCHS, LEARNING_RATES, VERSION, record_request
from idl_backend.contracts.courses import load_courses
from idl_backend.vision.training.digit_tsne_records import read_mnist, train_record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=ROOT / "datasets/mnist-original")
    parser.add_argument("--output", type=Path, default=ROOT / f"datasets/artifacts/{COURSE_ID}/digit-tsne/{VERSION}")
    parser.add_argument("--staging", type=Path, default=ROOT / "work/digit-tsne-oss")
    parser.add_argument("--device", default="cuda", choices=["cuda", "cpu"])
    args = parser.parse_args()
    if COURSE_ID not in load_courses():
        raise ValueError("The signed course identity is not registered.")
    training, validation, hashes = read_mnist(args.data_dir)
    entries = []
    for learning_rate in LEARNING_RATES:
        for batch_size in BATCH_SIZES:
            request = record_request({"learning_rate": learning_rate, "batch_size": batch_size})
            name = f"lr-{learning_rate:g}-batch-{batch_size}"
            output = args.output / name
            path = output / "record.json"
            if path.exists():
                record = json.loads(path.read_text(encoding="utf-8"))
                recording = record["recording"]
                if any(recording.get(key) != value for key, value in request.items()) or recording["dataset_sha256"] != hashes or len(record["frames"]) != EPOCHS+1:
                    raise ValueError(f"Existing recording does not match this experiment: {path}")
                print(f"Reusing {name}", flush=True)
            else:
                train_record(training, validation, hashes, learning_rate, batch_size, output, device=args.device)
            raw = path.read_bytes()
            digest = hashlib.sha256(raw).hexdigest()
            relative = f"{COURSE_ID}/digit-tsne/{VERSION}/{name}-{digest[:12]}.json"
            target = args.staging / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
            entries.append({"request_data": request, "path": relative, "sha256": digest, "bytes": len(raw)})
    args.staging.mkdir(parents=True, exist_ok=True)
    # The manifest is an operator input, not a publicly served asset.
    manifest = args.output / "manifest.json"
    manifest.write_text(json.dumps({"course_id": COURSE_ID, "version": VERSION, "entries": entries}, indent=2), encoding="utf-8")
    print(f"Completed {len(entries)} records; total {sum(entry['bytes'] for entry in entries)} bytes. Manifest: {manifest}", flush=True)


if __name__ == "__main__":
    main()
