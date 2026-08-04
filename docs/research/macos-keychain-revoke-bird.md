# Revoke Bird-related macOS Keychain access

Checked: 2026-07-22

## What the current Bird prompt most likely grants

Current upstream Bird does not store its own OAuth token. When reading X cookies from Chrome, Bird runs `security find-generic-password -s "Chrome Safe Storage" -w` to obtain Chrome's cookie-decryption secret. Choosing **Always Allow** therefore most likely added Bird's executable or `/usr/bin/security` to the Access Control list for the existing **Chrome Safe Storage** password item. [Bird cookie extraction source](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/cookies.ts#L72-L115)

Apple defines **Always Allow** as permitting the identified app or server to retrieve the keychain password without further authorization or notice. [Apple: keychain access prompts](https://support.apple.com/guide/keychain-access/if-youre-asked-for-access-to-your-keychain-kyca1243/mac)

## Revoke automatic access but keep the secret

1. Open **Keychain Access** using Spotlight.
2. Open the Keychain Viewer/sidebar if it is hidden, select the **login** keychain, then select **Passwords**.
3. Search for **Chrome Safe Storage**. If the original prompt named a different item, search for that exact name instead.
4. Double-click the password item and open **Access Control**.
5. Select **Confirm before allowing access**. If the pane lists individual allowed applications, remove the Bird executable/path or `/usr/bin/security` from that list using the minus button.
6. Save Changes and authenticate if prompted.

Apple documents the Access Control pane and the **Confirm before allowing access** option as the place to control automatic application access. [Apple: allow apps to access your keychain](https://support.apple.com/en-ca/guide/mac-help/kychn002/mac), [Apple: view keychain item information](https://support.apple.com/en-ca/guide/keychain-access/kyca1085/mac)

The next time Bird extracts Chrome cookies, macOS should ask again; choose **Allow Once** for one-time access or **Deny** to block it.

## Deleting an item

Do **not** delete **Chrome Safe Storage** merely to revoke Bird. Chrome uses that item to decrypt browser secrets, so deleting it can disrupt access to existing Chrome cookies or other stored data. Change its Access Control list instead.

Only delete an item if it is clearly Bird-specific and the intent is to remove the stored credential as well. For example, a future Bird OAuth implementation might create an item named `bird.x.oauth`; deleting that item would log Bird out and require a new OAuth authorization. Current upstream Bird does not create that item.

This permission is item-specific Keychain access, not the general **System Settings > Privacy & Security** permission list. App updates, path changes, or code-signature changes can cause macOS to ask again even for a previously trusted app. Apple notes that changed or updated applications may require reauthorization. [Apple: trusted app asks again](https://support.apple.com/en-ie/guide/keychain-access/kyca1331/mac)
