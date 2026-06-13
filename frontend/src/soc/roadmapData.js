// SOC Analyst 3-month roadmap — static data, no API.
// tag: 'audio' = 🎧 taxi-friendly, 'desk' = 💻 desk required

export const PHASES = {
  1: { name: 'Security+ Grind', color: 'sky', emoji: '📚' },
  2: { name: 'Labs + First Applications', color: 'violet', emoji: '🧪' },
  3: { name: 'Full Job Push', color: 'amber', emoji: '🚀' },
};

export const WEEKS = [
  {
    id: 'w1',
    month: 1,
    title: 'Security+ Domain 1 — General Security Concepts',
    goal: 'Build the study habit. Cover CIA triad, zero trust, controls, crypto basics.',
    daily: [
      { id: 'w1d1', tag: 'audio', text: 'Professor Messer SY0-701 Domain 1 videos as audio during shifts' },
      { id: 'w1d2', tag: 'audio', text: 'Between rides: explain CIA triad / zero trust aloud from memory' },
      { id: 'w1d3', tag: 'desk', text: 'Evening: create 20 Anki cards from today’s audio' },
      { id: 'w1d4', tag: 'desk', text: 'Evening: skim Messer notes for the sections you heard' },
      { id: 'w1d5', tag: 'audio', text: 'End of shift: 2-minute voice-memo teach-back of the day’s topic' },
    ],
    weekend: [
      { id: 'w1e1', hours: 2, text: 'Set up study HQ: Anki deck, Messer playlist, print SY0-701 exam objectives' },
      { id: 'w1e2', hours: 3, text: 'Full Domain 1 review + 30-question baseline quiz (write down your score)' },
    ],
    resources: [
      { label: 'Professor Messer SY0-701 course', url: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/' },
      { label: 'SY0-701 exam objectives (PDF)', url: 'https://www.comptia.org/certifications/security' },
      { label: 'Anki (flashcards)', url: 'https://apps.ankiweb.net/' },
    ],
  },
  {
    id: 'w2',
    month: 1,
    title: 'Domain 2 — Threats, Vulnerabilities & Mitigations',
    goal: 'Know every attack type and its mitigation, cold.',
    daily: [
      { id: 'w2d1', tag: 'audio', text: 'Messer Domain 2 audio: threat actors, attack surfaces, malware types' },
      { id: 'w2d2', tag: 'audio', text: 'Mental drill while driving: attack → mitigation (phishing → training + DMARC…)' },
      { id: 'w2d3', tag: 'desk', text: '20 new Anki cards + review yesterday’s deck' },
      { id: 'w2d4', tag: 'desk', text: 'One 15-minute practice quiz section (Messer / Dion)' },
    ],
    weekend: [
      { id: 'w2e1', hours: 2, text: 'Messer Domain 2 study-group replay or a full practice section' },
      { id: 'w2e2', hours: 2, text: 'Map Reserva work to Domain 2: OTP brute-force defence, rate limiting, reCAPTCHA — write 5 interview bullet stories' },
    ],
    resources: [
      { label: 'Messer monthly study group', url: 'https://www.professormesser.com/category/study-group/' },
    ],
  },
  {
    id: 'w3',
    month: 1,
    title: 'Domains 3 & 4 — Architecture + Security Operations',
    goal: 'The biggest exam domains. Your OSPF/VLAN/ACL labs already cover half of D3.',
    daily: [
      { id: 'w3d1', tag: 'audio', text: 'Messer Domain 3 audio: segmentation, VLANs, ACLs (familiar ground for you)' },
      { id: 'w3d2', tag: 'audio', text: 'Messer Domain 4 audio: logging, monitoring, SIEM concepts' },
      { id: 'w3d3', tag: 'desk', text: '20 Anki cards — drill the ports & protocols table hard' },
      { id: 'w3d4', tag: 'desk', text: '15-minute port/protocol speed quiz before bed' },
    ],
    weekend: [
      { id: 'w3e1', hours: 3, text: 'Practice exam #1 — full 90 questions, timed. Review every wrong answer' },
      { id: 'w3e2', hours: 2, text: 'Targeted review of your weakest domain from the practice exam' },
    ],
    resources: [
      { label: 'Messer practice exams', url: 'https://www.professormesser.com/recommended-reading/' },
    ],
  },
  {
    id: 'w4',
    month: 1,
    title: 'Domain 5 + Exam Week Prep',
    goal: 'Close out governance/risk/compliance and book the exam. No drifting.',
    daily: [
      { id: 'w4d1', tag: 'audio', text: 'Messer Domain 5 audio: governance, risk management, compliance' },
      { id: 'w4d2', tag: 'audio', text: 'Audio re-run of every Anki topic you keep getting wrong' },
      { id: 'w4d3', tag: 'desk', text: 'One practice-exam section every evening' },
      { id: 'w4d4', tag: 'desk', text: 'BOOK THE EXAM for early Week 5 (Pearson VUE — online or Warsaw centre)' },
    ],
    weekend: [
      { id: 'w4e1', hours: 3, text: 'Practice exam #2 — you want 85%+ before the real thing' },
      { id: 'w4e2', hours: 2, text: 'Final weak-area sweep + plan exam-day logistics' },
    ],
    resources: [
      { label: 'Pearson VUE — book Security+', url: 'https://home.pearsonvue.com/comptia' },
    ],
  },
  {
    id: 'w5',
    month: 2,
    title: 'Pass Security+ → Start TryHackMe SOC Level 1',
    goal: 'Get the cert, switch from theory to hands-on the same week.',
    daily: [
      { id: 'w5d1', tag: 'desk', text: 'EXAM DAY early this week — go pass it 🎯' },
      { id: 'w5d2', tag: 'audio', text: 'Decompress: start SOC podcasts (Darknet Diaries, Blue Team-focused eps)' },
      { id: 'w5d3', tag: 'desk', text: 'TryHackMe Cyber Defence Frameworks rooms — 30 min/evening' },
      { id: 'w5d4', tag: 'desk', text: 'Update LinkedIn headline: “Security+ | Aspiring SOC Analyst | Software Dev background”' },
    ],
    weekend: [
      { id: 'w5e1', hours: 3, text: 'THM: Pyramid of Pain, Cyber Kill Chain, MITRE ATT&CK rooms' },
      { id: 'w5e2', hours: 2, text: 'CV v1 security rewrite — use the framing tips in the sidebar' },
    ],
    resources: [
      { label: 'TryHackMe SOC Level 1 path', url: 'https://tryhackme.com/path/outline/soclevel1' },
      { label: 'Darknet Diaries podcast', url: 'https://darknetdiaries.com/' },
    ],
  },
  {
    id: 'w6',
    month: 2,
    title: 'Network Traffic Analysis',
    goal: 'Read packets like logs. Wireshark, Snort, Zeek fundamentals.',
    daily: [
      { id: 'w6d1', tag: 'audio', text: 'Talks/podcasts on traffic analysis & detection engineering' },
      { id: 'w6d2', tag: 'desk', text: 'THM Wireshark rooms — 30 min/evening' },
      { id: 'w6d3', tag: 'desk', text: 'THM Snort / NetworkMiner rooms' },
    ],
    weekend: [
      { id: 'w6e1', hours: 3, text: 'THM Wireshark traffic-analysis rooms + Zeek intro' },
      { id: 'w6e2', hours: 2, text: 'Install Splunk Free at home, ingest the BOTS sample dataset' },
    ],
    resources: [
      { label: 'Splunk Free download', url: 'https://www.splunk.com/en_us/download/splunk-enterprise.html' },
      { label: 'Splunk BOTS dataset', url: 'https://github.com/splunk/botsv3' },
    ],
  },
  {
    id: 'w7',
    month: 2,
    title: 'SIEM Week — Splunk + Wazuh',
    goal: 'Be able to say “I’ve run a SIEM at home” in interviews — and mean it.',
    daily: [
      { id: 'w7d1', tag: 'audio', text: 'SIEM architecture & use-case audio (ingestion, correlation, alerting)' },
      { id: 'w7d2', tag: 'desk', text: 'Splunk Search Fundamentals 1 (free course) — 30 min/evening' },
      { id: 'w7d3', tag: 'desk', text: 'SPL practice: index=, stats, table, eval on the BOTS data' },
    ],
    weekend: [
      { id: 'w7e1', hours: 3, text: 'Wazuh lab: agent on a VM, simulate failed SSH logins, watch alerts fire' },
      { id: 'w7e2', hours: 2, text: 'Write the lab up as a GitHub README with screenshots' },
    ],
    resources: [
      { label: 'Splunk free courses', url: 'https://www.splunk.com/en_us/training/free-courses/overview.html' },
      { label: 'Wazuh docs & install', url: 'https://wazuh.com/' },
    ],
  },
  {
    id: 'w8',
    month: 2,
    title: 'Incident Response + First Applications',
    goal: 'Start the pipeline. Applications are a numbers game — begin now, not when “ready”.',
    daily: [
      { id: 'w8d1', tag: 'desk', text: 'THM SOC L1 incident-response rooms — 30 min/evening' },
      { id: 'w8d2', tag: 'desk', text: 'Apply to 5 jobs/day (EU remote + Kraków/Warsaw SOC hubs)' },
      { id: 'w8d3', tag: 'audio', text: 'Listen through common SOC interview question lists' },
    ],
    weekend: [
      { id: 'w8e1', hours: 2, text: 'LetsDefend free tier: triage your first alerts in a simulated SOC' },
      { id: 'w8e2', hours: 2, text: 'Tailor CV for your top-10 target companies' },
    ],
    resources: [
      { label: 'LetsDefend', url: 'https://letsdefend.io/' },
      { label: 'justjoin.it (PL security jobs)', url: 'https://justjoin.it/job-offers/all-locations/security' },
    ],
  },
  {
    id: 'w9',
    month: 3,
    title: 'Volume Week — Applications + THM Certificate',
    goal: '10 applications/day. Finish SOC Level 1 and put the certificate on LinkedIn.',
    daily: [
      { id: 'w9d1', tag: 'desk', text: '10 applications/day — track every one in a spreadsheet' },
      { id: 'w9d2', tag: 'audio', text: 'Mock-interview Q&A audio: record yourself answering, replay, refine' },
      { id: 'w9d3', tag: 'desk', text: 'Finish remaining THM SOC L1 rooms' },
    ],
    weekend: [
      { id: 'w9e1', hours: 3, text: 'THM SOC L1 capstone → certificate → post it on LinkedIn' },
      { id: 'w9e2', hours: 2, text: 'Polish GitHub: pin lab writeups, clean READMEs, add profile bio' },
    ],
    resources: [
      { label: 'NoFluffJobs security (PL)', url: 'https://nofluffjobs.com/pl/security' },
    ],
  },
  {
    id: 'w10',
    month: 3,
    title: 'Interview Prep — Deep',
    goal: 'Drill triage scenarios until they’re boring. Follow up on every application.',
    daily: [
      { id: 'w10d1', tag: 'audio', text: 'Scenario drills aloud: “user reports phishing — walk me through your triage”' },
      { id: 'w10d2', tag: 'desk', text: '30-min SPL / SIEM query practice — keep the muscle warm' },
      { id: 'w10d3', tag: 'desk', text: 'Follow up on Week 8–9 applications (polite 1-liner after ~7 days)' },
    ],
    weekend: [
      { id: 'w10e1', hours: 2, text: 'Full mock interview (friend or AI), recorded. Review the recording' },
      { id: 'w10e2', hours: 2, text: 'Build a tools cheat-sheet from the job descriptions you’ve actually seen' },
    ],
    resources: [
      { label: 'SOC interview questions (LetsDefend blog)', url: 'https://letsdefend.io/blog/' },
    ],
  },
  {
    id: 'w11',
    month: 3,
    title: 'Differentiation — Show, Don’t Tell',
    goal: 'Stand out from cert-only candidates with public proof of work.',
    daily: [
      { id: 'w11d1', tag: 'audio', text: 'CySA+ intro audio (your likely next cert — zero pressure)' },
      { id: 'w11d2', tag: 'desk', text: 'Write a LinkedIn post/blog: “What building JWT auth taught me about detection”' },
      { id: 'w11d3', tag: 'desk', text: 'Keep applying 5/day + message 3 recruiters' },
    ],
    weekend: [
      { id: 'w11e1', hours: 3, text: 'Mini detection project: parse Django auth logs → alert script for failed-login bursts' },
      { id: 'w11e2', hours: 2, text: 'Write it up — this is your best interview artifact: dev who thinks in detections' },
    ],
    resources: [
      { label: 'CompTIA CySA+ overview', url: 'https://www.comptia.org/certifications/cybersecurity-analyst' },
    ],
  },
  {
    id: 'w12',
    month: 3,
    title: 'Close — Interviews & Negotiation',
    goal: 'Convert the pipeline. Know your numbers before anyone asks.',
    daily: [
      { id: 'w12d1', tag: 'desk', text: 'Interviews + same-day thank-you follow-ups' },
      { id: 'w12d2', tag: 'audio', text: 'Negotiation prep audio — know Tier-1 SOC ranges in PLN and EUR' },
      { id: 'w12d3', tag: 'desk', text: 'Keep the pipeline spreadsheet current — momentum matters' },
    ],
    weekend: [
      { id: 'w12e1', hours: 2, text: 'Retrospective: pipeline stats, what worked, what didn’t' },
      { id: 'w12e2', hours: 2, text: 'Month-4 plan: CySA+ start date or second interview wave' },
    ],
    resources: [
      { label: 'levels.fyi (salary data)', url: 'https://www.levels.fyi/' },
    ],
  },
];

export const CERT_PATH = [
  { name: 'CompTIA A+', status: 'done' },
  { name: 'Security+ (SY0-701)', status: 'current', note: 'Weeks 1–5' },
  { name: 'CySA+', status: 'next', note: 'Month 4+' },
];

export const JOB_BOARDS = [
  { label: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/' },
  { label: 'justjoin.it', url: 'https://justjoin.it/job-offers/all-locations/security', note: 'PL tech board' },
  { label: 'NoFluffJobs', url: 'https://nofluffjobs.com/pl/security', note: 'PL, salaries listed' },
  { label: 'isecjobs.com', url: 'https://isecjobs.com/', note: 'infosec only' },
  { label: 'CyberSecJobs', url: 'https://cybersecjobs.com/' },
];

export const CV_TIPS = [
  {
    from: 'Built JWT auth + OTP password reset (CSPRNG, SHA-256)',
    to: 'Identity & access management; secure credential storage and token lifecycle',
  },
  {
    from: 'Added rate limiting + reCAPTCHA on login',
    to: 'Brute-force attack mitigation and abuse prevention',
  },
  {
    from: 'OSPF / VLAN / ACL homelab',
    to: 'Network segmentation & access-control fundamentals (Security+ D3)',
  },
  {
    from: 'Deployed & debugged Django on Railway',
    to: 'Production log review, incident debugging, root-cause analysis',
  },
  {
    from: '8–12h taxi shifts while studying',
    to: 'Discipline, time management, calm communication under pressure — say this in the interview',
  },
];
