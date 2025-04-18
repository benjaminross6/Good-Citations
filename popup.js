console.log("popup.js is loaded");

const CLIENT_ID = window.ENV?.GOOGLE_CLIENT_ID;;
const REDIRECT_URI = 'https://' + 'mkejpeodkljhpgghbbciofhgminniemb' + '.chromiumapp.org/';
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly'
].join(' ');

function listDocs(accessToken) {
  fetch('https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.document"&fields=files(id,name)', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.files || data.files.length === 0) {
        document.getElementById('googleStatus').textContent = 'No Google Docs found.';
        return;
      }

      const firstDoc = data.files[0];
      fetchDocContent(accessToken, firstDoc.id);
    });
}

function fetchDocContent(accessToken, docId) {
  fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
    .then(res => res.json())
    .then(doc => {
      const body = doc.body.content || [];
      const text = body.map(el => {
        try {
          return el.paragraph.elements.map(e => e.textRun.content).join('');
        } catch {
          return '';
        }
      }).join('\n');
      document.getElementById('paperInput').value = text;
      document.getElementById('googleStatus').textContent = 'Document loaded!';
      generateRecommendations(text);
    });
}

function generateRecommendations(paper) {
    console.log("Generating recommendations for:", paper);
    console.log("Text in box:", paper);
    chrome.storage.local.get(["visitedPages"], (data) => {
      const visitedPages = data.visitedPages || [];
      console.log("Visited pages:", visitedPages);
      const keywords = extractKeywords(paper);
      console.log("Keywords:", keywords);
      console.log("Visited pages:", visitedPages);
      const matches = visitedPages.filter(page =>
        keywords.some(kw => page.text.toLowerCase().includes(kw))
      );
      const filteredMatches = matches.filter(match =>
        !/google\.com\/search|docs?hub|localhost/.test(match.url)
      );
      console.log("Filtered OUT:", matches.filter(m =>
        /google\.com\/search|docs?hub|localhost/.test(m.url)
      ));
  
      const container = document.getElementById("recommendations");
      container.innerHTML = ""; // Clear previous content

      const heading = document.createElement("h4");
      heading.textContent = "Recommended Citations:";
      container.appendChild(heading);
      if (filteredMatches.length === 0) {
        console.log("❌ No matches, exiting early");
        const noMatchMsg = document.createElement('p');
        noMatchMsg.textContent = "No matches found.";
        container.appendChild(noMatchMsg);
        return;
      }
  
      const scoredMatches = filteredMatches.map(page => {
        const score = keywords.reduce((count, kw) =>
          count + (page.text.toLowerCase().includes(kw) ? 1 : 0), 0);
        return { ...page, score };
      }).sort((a, b) => b.score - a.score);
      
      const countSelect = document.getElementById("citationCount");
      const count = parseInt(countSelect?.value || "5");
      console.log("🟡 Displaying citations:", scoredMatches.slice(0, count).map(m => m.url));
      
      scoredMatches.slice(0, count).forEach(match => {
        const el = document.createElement("div");
        const date = new Date(match.timestamp).toLocaleDateString();
        const citation = `"${match.url}". Accessed ${date}.`;
  
        el.innerHTML = `
          <p>
            <a href="${match.url}" target="_blank">${match.url}</a><br>
            <small>${match.timestamp}</small><br>
            <button class="copy-btn" aria-label="Copy citation for ${match.url}">Copy Citation</button>
          </p>
        `;
  
        el.querySelector('.copy-btn').addEventListener('click', () => {
          navigator.clipboard.writeText(citation).then(() => {
            el.querySelector('.copy-btn').textContent = "Copied!";
          });
        });
  
        container.appendChild(el);
      });
      document.getElementById("statusMsg").textContent = "Citations ready.";
    });
}

function updateTrackedPageCount() {
  chrome.storage.local.get(['visitedPages'], (data) => {
    const count = data.visitedPages ? data.visitedPages.length : 0;
    document.getElementById('statusMsg').textContent = `Paper saved. Finding citations... ${count} pages tracked.`;
  });
}

function extractKeywords(text) {
    const stopWords = new Set(["the", "is", "and", "of", "to", "a", "in", "that", "it", "with"]);
    return [...new Set(text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
    )].slice(0, 20); // Top 20 keywords for quick matching
}

function extractGoogleDocText() {
  try {
    const elements = document.querySelectorAll('.kix-paragraphrenderer');
    if (!elements.length) return null;

    let fullText = '';
    elements.forEach(el => {
      fullText += el.innerText + '\n';
    });
    return fullText;
  } catch (e) {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['googleAccessToken'], (data) => {
    if (data.googleAccessToken) {
      document.getElementById('googleStatus').textContent = 'Signed in (cached). Fetching your documents...';
      listDocs(data.googleAccessToken);
    }
  });

  updateTrackedPageCount();

  document.getElementById("submitPaper").addEventListener("click", () => {
    const paper = document.getElementById("paperInput").value;
  
    if (!paper.trim()) {
      document.getElementById("statusMsg").textContent = "Please enter your paper text.";
      return;
    }
  
    chrome.storage.local.set({ researchPaper: paper }, () => {
      updateTrackedPageCount();
      generateRecommendations(paper);
    });
  });

  document.getElementById("useGoogleDoc").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.url.includes("docs.google.com/document")) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            try {
              const elements = document.querySelectorAll('.kix-paragraphrenderer');
              if (!elements.length) return null;
              return Array.from(elements).map(el => el.innerText).join('\n');
            } catch (err) {
              return `Error: ${err.message}`;
            }
          }
        }, (injectionResults) => {
          console.log("Injection results:", injectionResults);
          console.log("Last error:", chrome.runtime.lastError);
          if (
            chrome.runtime.lastError || 
            !injectionResults || 
            !injectionResults[0].result || 
            (typeof injectionResults[0].result === "string" && injectionResults[0].result.startsWith("Error:"))
          ) {
            document.getElementById("statusMsg").textContent = "Failed to extract Google Doc content.";
            return;
          }
          const text = injectionResults[0].result;
          document.getElementById("paperInput").value = text;
          document.getElementById("statusMsg").textContent = "Loaded Google Doc content.";
          generateRecommendations(text);
        });
      } else {
        document.getElementById("statusMsg").textContent = "Not a Google Docs page.";
      }
    });
  });

  document.getElementById('signInGoogle').addEventListener('click', () => {
    console.log("Sign-in button clicked");
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (redirectUri) => {
      if (chrome.runtime.lastError || !redirectUri) return;
      const accessToken = new URL(redirectUri).hash.match(/access_token=([^&]*)/)[1];
      console.log('Access Token:', accessToken);
      chrome.storage.local.set({ googleAccessToken: accessToken }, () => {
        document.getElementById('googleStatus').textContent = 'Signed in. Fetching your documents...';
        listDocs(accessToken);
      });
    });
  });
});