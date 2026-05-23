const express = require('express');
const Database = require('better-sqlite3');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = 3000;

// Initialize the Google Gen AI client with your active key
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

// Middleware to parse incoming JSON payloads
app.use(express.json());

// 1. DATABASE SETUP
const db = new Database(':memory:');
db.exec(`
  CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rank TEXT NOT NULL,
    fees TEXT NOT NULL,
    exam TEXT NOT NULL,
    cutoff TEXT NOT NULL,
    streams TEXT NOT NULL,
    placement TEXT NOT NULL,
    infrastructure TEXT NOT NULL,
    url TEXT NOT NULL
  )
`);

const insert = db.prepare(`
  INSERT INTO colleges (name, rank, fees, exam, cutoff, streams, placement, infrastructure, url) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const mockColleges = [
  { 
    name: 'IIT Bombay', 
    rank: 'NIRF #1 (Engineering)', 
    fees: '₹2,20,000 / year', 
    exam: 'JEE Advanced', 
    cutoff: 'Closing Rank ~300 (Computer Science)',
    streams: 'CSE, Electrical, Mechanical, Aerospace, Chemical',
    placement: '₹24.0 LPA Avg', 
    infrastructure: '550+ Acre Lakeside Powai Campus, Advanced Nanoelectronics Labs, Olympic-size Swimming Pool.',
    url: 'https://acad.iitb.ac.in/'
  },
  { 
    name: 'BITS Pilani', 
    rank: 'NIRF #4 (Private)', 
    fees: '₹5,40,000 / year', 
    exam: 'BITSAT', 
    cutoff: 'Score ~331/400 (Computer Science)',
    streams: 'Computer Science, Electronics, Civil, Chemical, Mechanical',
    placement: '₹18.2 LPA Avg', 
    infrastructure: '328 Acre Desert Oasis Green Campus, Historic Clock Tower Central Building.',
    url: 'https://admissions.bits-pilani.ac.in/'
  },
  { 
    name: 'Jadavpur University', 
    rank: 'NIRF #10 (University)', 
    fees: '₹10,000 / year', 
    exam: 'WBJEE', 
    cutoff: 'GMR Rank ~80 (Computer Science)',
    streams: 'CSE, IT, Electronics, Power Engineering, Mechanical',
    placement: '₹11.5 LPA Avg', 
    infrastructure: 'Historic Urban Tech Campus, World-class Illumination Engineering Testing Facility.',
    url: 'https://jadavpuruniversity.in'
  },
  { 
    name: 'NIT Trichy', 
    rank: 'NIRF #8 (Engineering)', 
    fees: '₹1,80,000 / year', 
    exam: 'JEE Main', 
    cutoff: 'OS Closing Rank ~5000 (Computer Science)',
    streams: 'CSE, ECE, EEE, Production Engineering, Chemical, Civil',
    placement: '₹15.5 LPA Avg', 
    infrastructure: '800 Acre Mega Research Campus, Iconic Octagon Computer Center Hub.',
    url: 'https://www.nitt.edu'
  }
];

for (const college of mockColleges) {
  insert.run(
    college.name, college.rank, college.fees, college.exam, 
    college.cutoff, college.streams, college.placement, college.infrastructure, college.url
  );
}

// 2. BACKEND API ENDPOINTS
app.get('/api/search', (req, res) => {
  const query = req.query.query || '';
  try {
    const collegesQuery = db.prepare(`SELECT * FROM colleges WHERE name LIKE ?`);
    const colleges = collegesQuery.all(`%${query}%`);
    res.json({ colleges });
  } catch (error) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question cannot be empty' });
  }

  try {
    const contextPrompt = `
      You are the official Gemini AI Copilot built into Lungring's Ultimate College Decision Portal. 
      You help students with admissions questions, exam strategies, tracking details, or general computer science concepts.
      Keep answers structured, clear, and highly supportive.
      
      User Question: ${question}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
    });

    res.json({ answer: response.text });
  } catch (error) {
    console.error("=== SYSTEM AI LOG ERROR ===", error.message);
    res.json({ answer: "I encountered an issue connecting to my core brain network. Check your terminal output window for errors!" });
  }
});

// 3. FRONTEND INTERFACE
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Evaluation Hub - College Portal</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 0; background: #f1f3f4; color: #202124; display: flex; flex-direction: column; height: 100vh; }
        .chrome-frame { display: flex; flex-direction: column; background: #dee1e6; padding: 8px 8px 0 8px; border-bottom: 1px solid #cacdd1; }
        .chrome-tabs { display: flex; gap: 6px; padding-left: 8px; align-items: flex-end; }
        .chrome-tab { background: #ffffff; padding: 8px 16px; border-radius: 8px 8px 0 0; font-size: 12px; font-weight: 500; color: #202124; width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: none; text-align: left; }
        .chrome-navbar { display: flex; align-items: center; background: #ffffff; padding: 8px; gap: 12px; border-radius: 8px 8px 0 0; }
        .address-bar { flex: 1; background: #f1f3f4; border-radius: 30px; padding: 6px 20px; font-size: 14px; color: #202124; display: flex; align-items: center; gap: 8px; border: 1px solid transparent; }
        .browser-content-viewport { flex: 1; background: #ffffff; overflow-y: auto; padding: 30px; box-sizing: border-box; }
        .page-container { max-width: 900px; margin: 0 auto; }
        .dashboard-blueprint { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .blueprint-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .blueprint-card h3 { margin-top: 0; margin-bottom: 12px; color: #1e3a8a; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
        .blueprint-card ol, .blueprint-card ul { padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.6; color: #334155; }
        .search-wrapper { position: relative; margin-bottom: 30px; }
        .search-wrapper input { width: 100%; padding: 14px 20px; font-size: 16px; border: 2px solid #dadce0; border-radius: 24px; box-sizing: border-box; outline: none; box-shadow: 0 1px 6px rgba(32,33,36,0.1); }
        .grid-layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .college-card { border: 1px solid #dadce0; border-radius: 8px; padding: 25px; background: white; transition: box-shadow 0.2s; border-left: 6px solid #0070f3; }
        .card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .college-name-text { font-size: 22px; font-weight: bold; color: #1a73e8; margin: 0; text-decoration: none; display: inline-block; }
        .college-name-text:hover { text-decoration: underline; color: #1557b0; }
        .metrics-grid-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .metric-cell { background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #f1f3f4; }
        .metric-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #70757a; }
        .metric-value { font-size: 14px; color: #202124; font-weight: 500; margin-top: 2px; }
        .infra-badge-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; font-size: 13px; color: #166534; line-height: 1.4; margin-bottom: 15px; }
        .compare-workspace { background: #fff; border: 1px solid #ffbb00; border-radius: 8px; padding: 20px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: none; }
        .compare-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .compare-table th, .compare-table td { padding: 12px; text-align: center; border: 1px solid #dadee0; font-size: 14px; }
        .compare-table th { background: #f8fafa; }
        .forum-card { background: #f8f9fa; border: 1px solid #dadce0; border-radius: 8px; padding: 25px; margin-top: 40px; }
        .forum-input-row { display: flex; gap: 10px; margin-bottom: 20px; }
        .forum-input-row input { flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; }
        .thread-container { display: flex; flex-direction: column; gap: 12px; }
        .post-bubble { background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .post-bubble.ai-reply { border-left: 5px solid #1a73e8; background: #f0f4f9; padding-left: 20px; }
        .post-meta { font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 4px; }
        .post-text { font-size: 14px; color: #334155; line-height: 1.4; }
        .typing-indicator { font-size: 13px; color: #1a73e8; font-style: italic; display: none; margin-top: 5px; margin-left: 10px; font-weight: 500; }
        .btn { background: #1a73e8; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
        .btn:hover { background: #1557b0; }
        .btn-download { background: #137333; display: block; margin: 0 auto; }
        .checkbox-pill { display: flex; align-items: center; gap: 6px; font-size: 13px; background: #fef7e0; padding: 6px 12px; border-radius: 16px; border: 1px solid #feefc3; cursor: pointer; color: #b06000; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="chrome-frame">
        <div class="chrome-tabs">
          <div class="chrome-tab">🏛️ Evaluation Hub</div>
        </div>
        <div class="chrome-navbar">
          <div class="address-bar"><span>🔒 Secure Connection |</span><input type="text" value="https://college-evaluation-hub.local" readonly /></div>
        </div>
      </div>
      
      <div class="browser-content-viewport">
        <div class="page-container">
          <div class="dashboard-blueprint">
            <div class="blueprint-card" style="border-left: 5px solid #2563eb;">
              <h3>📖 Platform Instructions (How To Use)</h3>
              <ol>
                <li><strong>Search & Filter:</strong> Type in the input field to instantly narrow down college records.</li>
                <li><strong>Visit Official Sites:</strong> Click any <u>Blue Title Link</u> to open that college's genuine website in a new tab.</li>
                <li><strong>AI Consultation:</strong> Drop a question into the Discussion Board to trigger an immediate automated analysis from **Gemini AI**.</li>
              </ol>
            </div>
            <div class="blueprint-card" style="border-left: 5px solid #b99110;">
              <h3>⚡ Engine Features & Frameworks</h3>
              <ul>
                <li><strong>Gemini AI Integration Module:</strong> Automatically intercepts context parameters to provide immediate answers.</li>
                <li><strong>300ms Input Debouncing:</strong> Prevents text input stutters and heavy database spikes.</li>
                <li><strong>Local Storage State Saving:</strong> Seamlessly packages, manages, and down-saves summaries into local files.</li>
              </ul>
            </div>
          </div>
          
          <div id="compare-section" class="compare-workspace">
            <h3 style="margin: 0; color: #b06000; display: flex; justify-content: space-between; align-items: center; font-size: 16px;">
              <span>⚖️ Side-by-Side Analytics Board Matrix</span>
              <button class="btn btn-download" onclick="triggerOfflineProfileExport()">📥 Save & Download Selected Summary (.TXT)</button>
            </h3>
            <table class="compare-table">
              <thead><tr id="compare-headers"></tr></thead>
              <tbody id="compare-rows"></tbody>
            </table>
          </div>
          
          <div class="search-wrapper">
            <input type="text" id="search-box-field" placeholder="Search Google or type an engineering institution name to trigger context logs...">
          </div>
          
          <div id="profiles-grid-feed" class="grid-layout"></div>
          
          <div class="forum-card">
            <h3 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span>💬 Student Query Discussion Board</span>
              <span id="gemini-status" style="font-size:11px; background:#e8f0fe; color:#1a73e8; padding:4px 10px; border-radius:12px; font-weight:600;">✨ Gemini Copilot Active</span>
            </h3>
            <div class="forum-input-row">
              <input type="text" id="post-input-text" placeholder="Ask Gemini something (e.g., How to crack Jadavpur University?)...">
              <button class="btn" onclick="submitForumPost()">Ask AI</button>
            </div>
            <div id="ai-typing" class="typing-indicator">✨ Gemini AI is generating response context parameters...</div>
            <br>
            <div id="threads-container-box" class="thread-container"></div>
          </div>
        </div>
      </div>

      <script>
        let searchTerm = '';
        let debounceTimer;
        let selectedColleges = []; 
        let allColleges = [];      
        let discussionPosts = [
          { author: "Student_Reviewer_JU", content: "Is Jadavpur University the best campus choice for core streams regarding ROI parameter values?", isAI: false },
          { author: "✨ Gemini AI (Automated Copilot)", content: "Based on database metrics records, Jadavpur University provides unparalleled ROI. The annual fee structure is highly subsidized at ₹10,000 per annum, while the placement statistics maintain a competitive average package of ₹11.5 LPA, matching several top-tier national institutes.", isAI: true }
        ];

        const searchBar = document.getElementById('search-box-field');
        searchBar.addEventListener('input', (e) => {
          searchTerm = e.target.value;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => { performSearchFetch(); }, 300);
        });

        async function performSearchFetch() {
          const res = await fetch('/api/search?query=' + searchTerm);
          const data = await res.json();
          allColleges = data.colleges;
          const feed = document.getElementById('profiles-grid-feed');
          feed.innerHTML = '';
          if(data.colleges.length === 0) {
            feed.innerHTML = '<p style="text-align:center; color:#5f6368; font-size:14px; margin-top:20px;">No matching records found in the system memory.</p>';
            return;
          }
          data.colleges.forEach(college => {
            const isChecked = selectedColleges.some(c => c.id === college.id) ? 'checked' : '';
            
            feed.innerHTML += \`
              <div class="college-card">
                <div class="card-header-flex">
                  <div>
                    <a class="college-name-text" href="\${college.url}" target="_blank">
                      \${college.name} ↗
                    </a>
                    <div style="font-size: 12px; color: #70757a; margin-top: 2px;">Click to visit official external site</div>
                  </div>
                  <label class="checkbox-pill">
                    <input type="checkbox" \${isChecked} onchange="toggleMatrixRow(\${college.id}, this.checked)"> Add to Compare
                  </label>
                </div>
                <div class="metrics-grid-box">
                  <div class="metric-cell"><div class="metric-label">🏆 NIRF Rank</div><div class="metric-value">\${college.rank}</div></div>
                  <div class="metric-cell"><div class="metric-label">💰 Tuition Fees</div><div class="metric-value">\${college.fees}</div></div>
                  <div class="metric-cell"><div class="metric-label">📝 Entry Exam</div><div class="metric-value">\${college.exam}</div></div>
                  <div class="metric-cell"><div class="metric-label">📊 Entrance Cutoff</div><div class="metric-value" style="color:#b06000;">\${college.cutoff}</div></div>
                  <div class="metric-cell" style="grid-column: span 2;"><div class="metric-label">⚙️ Available Streams</div><div class="metric-value">\${college.streams}</div></div>
                  <div class="metric-cell" style="grid-column: span 2;"><div class="metric-label">📈 Placements Statistics</div><div class="metric-value" style="color:#137333; font-weight:bold;">\${college.placement}</div></div>
                </div>
                <div class="infra-badge-box"><strong>🏢 Campus Infrastructure Properties:</strong> \${college.infrastructure}</div>
              </div>
            \`;
          });
          refreshMatrixGridDisplay();
        }

        function toggleMatrixRow(id, isChecked) {
          if (isChecked) {
            const college = allColleges.find(c => c.id === id);
            if (college && !selectedColleges.some(c => c.id === id)) { selectedColleges.push(college); }
          } else {
            selectedColleges = selectedColleges.filter(c => c.id !== id);
          }
          refreshMatrixGridDisplay();
        }

        function refreshMatrixGridDisplay() {
          const section = document.getElementById('compare-section');
          const headers = document.getElementById('compare-headers');
          const rows = document.getElementById('compare-rows');
          if (selectedColleges.length < 2) {
            section.style.display = 'none';
            return;
          }
          section.style.display = 'block';
          headers.innerHTML = '<th>Core Features</th>' + selectedColleges.map(c => \`<th>\${c.name}</th>\`).join('');
          rows.innerHTML = \`
            <tr><td><strong>Placements Max</strong></td>\${selectedColleges.map(c => \`<td style="color:#137333;font-weight:bold;">\${c.placement}</td>\`).join('')}</tr>
            <tr><td><strong>NIRF Categorization</strong></td>\${selectedColleges.map(c => \`<td>\${c.rank}</td>\`).join('')}</tr>
            <tr><td><strong>Annual Tuition Fees</strong></td>\${selectedColleges.map(c => \`<td>\${c.fees}</td>\`).join('')}</tr>
            <tr><td><strong>Entrance Cutoffs</strong></td>\${selectedColleges.map(c => \`<td style="color:#b06000;font-weight:bold;">\${c.cutoff}</td>\`).join('')}</tr>
          \`;
        }

        async function submitForumPost() {
          const input = document.getElementById('post-input-text');
          const text = input.value.trim();
          if(!text) return;
          
          discussionPosts.unshift({ author: "Anonymous_Student", content: text, isAI: false });
          input.value = '';
          renderForumThreadsUI();
          
          const typingIndicator = document.getElementById('ai-typing');
          typingIndicator.style.display = 'block';
          
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question: text })
            });
            const data = await response.json();
            
            typingIndicator.style.display = 'none';
            discussionPosts.unshift({ author: "✨ Gemini AI (Automated Copilot)", content: data.answer, isAI: true });
            renderForumThreadsUI();
          } catch (err) {
            typingIndicator.style.display = 'none';
            discussionPosts.unshift({ author: "✨ Gemini AI (Automated Copilot)", content: "Connection timed out. Please try sending your inquiry again.", isAI: true });
            renderForumThreadsUI();
          }
        }

        function renderForumThreadsUI() {
          const container = document.getElementById('threads-container-box');
          container.innerHTML = '';
          discussionPosts.forEach(post => {
            const aiClass = post.isAI ? 'ai-reply' : '';
            container.innerHTML += \`
              <div class="post-bubble \${aiClass}">
                <div class="post-meta">👤 \${post.author} • Discussion Timeline</div>
                <div class="post-text">\${post.content}</div>
              </div>
            \`;
          });
        }

        function triggerOfflineProfileExport() {
          let textBuffer = 'BATCH MATRIX SPECIFICATIONS LOG\\n\\n';
          selectedColleges.forEach(c => {
            textBuffer += \`CAMPUS FILE: \${c.name}\\n• Rank: \${c.rank}\\n• Fees: \${c.fees}\\n• Placements: \${c.placement}\\n• Cutoff: \${c.cutoff}\\n\\n\`;
          });
          executeBlobDownload('Combined_Comparison_Profiles.txt', textBuffer);
        }

        function executeBlobDownload(filename, text) {
          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
        }

        renderForumThreadsUI();
        performSearchFetch();
      </script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log('Server running at http://localhost:' + port);
});   