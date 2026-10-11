# Module Identity

Active course modules receive a stable, signed identity in the top-level `moduleIdentity` field of `outlines.json`. The identity is separate from page-level `id` fields.

## Commands

Run these commands from the repository root.

```powershell
# Add identities to modules that do not have one yet; validate existing identities.
python -m idl_backend.contracts.identity

# Validate all module identities without writing files.
python -m idl_backend.contracts.identity --check
```

The script scans `modules/*/outlines.json`. It adds a UUID v4 and Ed25519 signature only when `moduleIdentity` is absent. Existing identities are preserved exactly after validation. A malformed or invalid existing identity stops the run; the script never repairs or replaces it automatically. It validates every outline before writing any missing identity.

The signature covers the module URL path and UUID, not the rest of the outline. Course titles, descriptions, and page content can change without changing the identity. Changing the UUID, signature, or signed module path makes validation fail. This is an identity-integrity check, not a signature over all course content.

## Signing Key

The script contains the fixed public verification key. Do not edit it: doing so invalidates verification for identities already issued. The corresponding Ed25519 private signing key is stored at `.private/module-identity-ed25519.pem`, which is ignored by Git. Keep that private key secret and backed up securely. Losing it does not prevent verification of existing identities, but prevents issuing identities for new modules. Do not put the private key in the script or commit it to the repository.

The script requires the `cryptography` Python package, declared in `requirements.txt`.
