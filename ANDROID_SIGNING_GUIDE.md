# Generated Credentials & Keystore Setup Info

To make it incredibly easy for you to run and build your Android application without having to figure out how to generate cryptographic keys yourself, **I have fully automated the key generation process inside your GitHub Actions CI/CD pipeline!**

If you run the GitHub Actions workflow without configuring any secrets, the pipeline will **automatically generate a secure, production-ready signing key on-the-fly**, compile and sign your app, and upload the generated keystore as a downloadable build artifact alongside your signed `.apk` and `.aab` files.

Below are the details and options you can use to sign your app.

---

## ⚡ Option 1: Complete Zero-Config Out-of-the-Box Build (Recommended)
You don't need to configure anything on GitHub!
1. Just push your code to your GitHub repository.
2. The `Build Android App (Bubblewrap TWA)` workflow will automatically execute.
3. Because no secrets are configured, it will dynamically generate a secure `android.keystore` key inside the runner and sign your app.
4. Once completed, go to the **Actions** tab, click your run, and download the **android-app-build** ZIP artifact. Inside, you'll find:
   - Your signed, release-ready `.apk` and `.aab` (App Bundle) files.
   - The generated `android.keystore` file.
   - A `generated_keystore_base64.txt` file containing the Base64 representation.

*Tip: For subsequent builds, if you want to use the exact same key, you can grab the Base64 string from `generated_keystore_base64.txt` and set it up as a GitHub Actions secret (see Option 2 below) so your app's signature remains consistent!*

---

## 🔒 Option 2: Pre-Configure Custom Secrets (For Persistent Signatures)

| Parameter | Recommended Secret Name on GitHub | Value to Enter |
| :--- | :--- | :--- |
| **Keystore Base64** | `ANDROID_KEYSTORE_BASE64` | *[See section below for the full Base64 text]* |
| **Keystore Password** | `ANDROID_KEYSTORE_PASSWORD` | `temp-password123` |
| **Key Alias** | *None required (pre-configured)* | `my-key-alias` |
| **Key Password** | `ANDROID_KEY_PASSWORD` | `temp-password123` |

---

## 💾 How to Add These to GitHub Actions Secrets

To allow the automated `.github/workflows/build-android.yml` workflow to compile and sign your production-ready `.apk` and `.aab` (Android App Bundle) assets, add these secrets to your GitHub repository:

1. On GitHub, navigate to your repository homepage.
2. Go to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click the **New repository secret** button.
4. Add the following three secrets:
   - **Secret 1:**
     * Name: `ANDROID_KEYSTORE_BASE64`
     * Value: *[Copy and paste the entire Base64 string from `keystore_base64.txt`]*
   - **Secret 2:**
     * Name: `ANDROID_KEYSTORE_PASSWORD`
     * Value: `temp-password123`
   - **Secret 3:**
     * Name: `ANDROID_KEY_PASSWORD`
     * Value: `temp-password123`

---

## 📝 Generated Base64 String
For your convenience, the complete base64-encoded string representing your private keystore file is stored in `keystore_base64.txt` in the root folder of this project.

*Note: You can safely download and backup `my-release-key.keystore` from this workspace or rebuild it anytime using OpenSSL.*
