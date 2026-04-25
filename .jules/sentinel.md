## 2025-05-15 - Input Validation and Length Limits
**Vulnerability:** Missing input length limits on user-provided strings (Player Name) could lead to UI breakage or minor DoS.
**Learning:** Enforcing limits at both the UI layer (maxLength) and the System layer (trim/slice) provides defense-in-depth and ensures data integrity regardless of the entry point.
**Prevention:** Always apply length constraints and sanitization to user-controlled inputs that are persisted or rendered globally.

## 2025-05-16 - Structural Validation for Deserialized Data
**Vulnerability:** Insecure deserialization of save game data from `localStorage` using blind type casting (`as SaveData`).
**Learning:** Blindly trusting data from `localStorage` or other external sources can lead to runtime crashes or logic errors if the data is malformed or maliciously modified.
**Prevention:** Always perform structural validation (checking presence and types of required fields) on deserialized JSON data before using it in application logic.
