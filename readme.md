# 🧠 Research Assistant Chrome Extension

The Research Assistant is a Chrome extension designed to help streamline the academic writing and citation process. It automatically tracks web pages you visit during research, stores their content, and recommends citations based on the content of your research paper.

## ✨ Features

- ✅ Automatically tracks visited web pages  
- ✅ Pulls text from Google Docs  
- ✅ Suggests citations based on paper keywords and visited content  
- ✅ Filters out uncitable sources (like Google search, DocsHub, etc.)  
- ✅ Ranks recommendations by relevance  
- ✅ Lets you control how many citations are shown  
- ✅ Supports copying citations in MLA-style format

## 🚀 Getting Started

## 🔐 Setting Up Google OAuth Credentials

To use the Google Docs integration, you'll need to create a Google OAuth 2.0 client ID.

### 1. Go to the Google Cloud Console

Visit: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### 2. Create a Project

- Click “Select a project” → “New Project”
- Give it a name (e.g., "Research Assistant Extension")

### 3. Enable the APIs

Go to **APIs & Services → Library**, and enable:
- Google Docs API
- Google Drive API

### 4. Create OAuth 2.0 Client ID

- Go to **APIs & Services → Credentials**
- Click **+ CREATE CREDENTIALS** → **OAuth client ID**
- Choose **Web application**
- Set the name (e.g., "Research Assistant")
- Under **Authorized redirect URIs**, add:

```
https://<your-extension-id>.chromiumapp.org/
```

(You can find your extension ID from `chrome://extensions`)

- Click **Create**

### 5. Copy the Client ID

You’ll need to copy the client ID and place it in your `.env` or `.env.js` file like this:

**.env**
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**.env.js**
```js
window.ENV = {
  GOOGLE_CLIENT_ID: "your-client-id.apps.googleusercontent.com"
};
```

Include `.env.js` in `popup.html` before `popup.js`.

This client ID is safe to include in your frontend — it’s public-facing and necessary for OAuth.

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/research-assistant.git
cd research-assistant