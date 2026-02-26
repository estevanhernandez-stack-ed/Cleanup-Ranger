# 🌲 Cleanup Ranger: Codespace Playbook

This playbook describes how to access and run the **Cleanup Ranger** development environment directly in the cloud using GitHub Codespaces.

## 🚀 Accessing the Environment

1.  **Open Repository**: Navigate to [estevanhernandez-stack-ed/Cleanup-Ranger](https://github.com/estevanhernandez-stack-ed/Cleanup-Ranger).
2.  **Launch Codespace**:
    - Click the green **"<> Code"** button.
    - Select the **Codespaces** tab.
    - Click **"Create codespace on main"**.
3.  **Wait for Initialization**: GitHub will provision a virtual machine. The environment is pre-configured with the correct Node.js version and extensions.

## 🔒 Environment Setup (Secrets)

To ensure the app has access to the necessary APIs, you must add your secrets to GitHub:

1.  **Repository Settings**: Go to **Settings > Secrets and variables > Codespaces**.
2.  **Add Secrets**: Add the following keys (copy values from your local `.env`):
    - `VITE_FIREBASE_API_KEY`
    - `VITE_FIREBASE_AUTH_DOMAIN`
    - `VITE_FIREBASE_PROJECT_ID`
    - `VITE_FIREBASE_STORAGE_BUCKET`
    - `VITE_FIREBASE_MESSAGING_SENDER_ID`
    - `VITE_FIREBASE_APP_ID`
    - `VITE_FIREBASE_MEASUREMENT_ID`
    - `VITE_GOOGLE_MAPS_API_KEY`
    - `VITE_GEMINI_API_KEY`

## 🖥️ Running the App

1.  **Open Terminal**: In the bottom panel of the Codespace (VS Code in Browser).
2.  **Start Dev Server**:
    ```bash
    npm run dev
    ```
3.  **Preview**: A popup will appear in the bottom-right corner. Click **"Open in Browser"** to view the live app.
    - Note: The app will be served on port `5173`. GitHub auto-forwards this to a public URL.

## 🛠️ Maintenance & Tips

- **Rebuild Container**: If the environment feels slow or you change the `.devcontainer` config, use `Ctrl+Shift+P` and type "Rebuild Container".
- **Extensions**: The environment comes with ESLint and Prettier pre-installed for consistent formatting.
