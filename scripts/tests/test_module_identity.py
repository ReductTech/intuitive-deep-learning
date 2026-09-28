import base64
import unittest

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from scripts.module_identity import (
    IDENTITY_VERSION,
    IdentityError,
    ROOT,
    _signed_payload,
    _validate_identity,
)


class ModuleIdentityTests(unittest.TestCase):
    def setUp(self):
        self.private_key = Ed25519PrivateKey.generate()
        self.module_path = "/modules/example-course"
        self.module_id = "2e5c4732-a40a-4d20-b954-a61507aabc75"
        signature = self.private_key.sign(
            _signed_payload(self.module_path, self.module_id, IDENTITY_VERSION)
        )
        self.identity = {
            "version": IDENTITY_VERSION,
            "id": self.module_id,
            "signature": base64.b64encode(signature).decode("ascii"),
        }
        self.outline_path = ROOT / "modules" / "example-course" / "outlines.json"

    def test_valid_identity_is_accepted(self):
        _validate_identity(
            self.identity,
            self.module_path,
            self.outline_path,
            self.private_key.public_key(),
        )

    def test_changed_id_is_rejected(self):
        modified = {**self.identity, "id": "5c8c4451-c057-437a-bec5-1b6d902891d3"}
        with self.assertRaisesRegex(IdentityError, "签名无效"):
            _validate_identity(
                modified,
                self.module_path,
                self.outline_path,
                self.private_key.public_key(),
            )

    def test_identity_cannot_be_moved_to_another_module_path(self):
        with self.assertRaisesRegex(IdentityError, "签名无效"):
            _validate_identity(
                self.identity,
                "/modules/another-course",
                self.outline_path,
                self.private_key.public_key(),
            )


if __name__ == "__main__":
    unittest.main()
