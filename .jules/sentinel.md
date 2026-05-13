## 2025-05-15 - Input Validation and Length Limits
**Vulnerability:** Missing input length limits on user-provided strings (Player Name) could lead to UI breakage or minor DoS.
**Learning:** Enforcing limits at both the UI layer (maxLength) and the System layer (trim/slice) provides defense-in-depth and ensures data integrity regardless of the entry point.
**Prevention:** Always apply length constraints and sanitization to user-controlled inputs that are persisted or rendered globally.

## 2025-05-16 - Structural Validation for Deserialized Data
**Vulnerability:** Insecure deserialization of save game data from `localStorage` using blind type casting (`as SaveData`).
**Learning:** Blindly trusting data from `localStorage` or other external sources can lead to runtime crashes or logic errors if the data is malformed or maliciously modified.
**Prevention:** Always perform structural validation (checking presence and types of required fields) on deserialized JSON data before using it in application logic.

## 2025-05-20 - Server-Side Command Validation
**Vulnerability:** Game state exploits via unsanitized command parameters (e.g., negative transaction amounts, invalid enum strings).
**Learning:** Validating inputs at the authoritative state boundary (the "Server") prevents logic exploits and runtime crashes. Relying only on UI-level validation is insufficient for robust security.
**Prevention:** Always validate command parameters against allowed ranges (e.g., positive integers) and valid enum values (using `Object.values().includes()`) before modifying authoritative state.

## 2025-05-25 - Server-Side Authorization (Ownership) Checks
**Vulnerability:** Authorization bypass (IDOR) where a player could modify settlements or units they did not own via direct command dispatch.
**Learning:** Checking for entity existence is insufficient; the server must also verify that the current player has the authority (ownership) to modify that specific entity.
**Prevention:** Always validate that the `currentPlayerId` matches the owner of the target resource before applying state transitions in the authoritative server.
