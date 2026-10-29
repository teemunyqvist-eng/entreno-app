#!/usr/bin/env node
/**
 * Smoke check for wife Spanish entreno app.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = __dirname;
let failed = 0;
function ok(msg) { console.log('OK  ', msg); }
function bad(msg) { console.error('FAIL', msg); failed++; }

// Files
for (const f of ['index.html','app.js','plan.js','exercises.js','progress.js','garmin.js','styles.css','sw.js','manifest.json','coach-plan.json','icon.svg']) {
  if (!fs.existsSync(path.join(ROOT, f))) bad('missing ' + f); else ok('file ' + f);
}

const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const coach = JSON.parse(fs.readFileSync(path.join(ROOT, 'coach-plan.json'), 'utf8'));
const plan = fs.readFileSync(path.join(ROOT, 'plan.js'), 'utf8');

if (app.includes("STORAGE_KEY = 'entreno-esposa-v1'")) ok('STORAGE_KEY'); else bad('STORAGE_KEY');
if (app.includes("COACH_STORAGE_KEY = 'entreno-esposa-coach'")) ok('COACH_STORAGE_KEY'); else bad('COACH_STORAGE_KEY');
if (app.includes("BACKUP_APP_ID = 'entreno-esposa'")) ok('BACKUP_APP_ID'); else bad('BACKUP_APP_ID');
if (app.includes("strengthLocation: 'koti'")) ok('home strength default'); else bad('home strength');
if (app.includes("noGymCard: true")) ok('noGymCard'); else bad('noGymCard');
if (app.includes("salibandyDow: 'none'")) ok('salibandy off'); else bad('salibandy default');
if (!app.includes('Paavo Nurmi') && !app.includes('treeni-app-v7')) ok('no Teemu branding in app.js'); else bad('Teemu branding leaked');
if (index.includes('lang="es"') && index.includes('Hoy') && index.includes('Entreno')) ok('Spanish index'); else bad('index Spanish');
if (man.lang === 'es' && /10k/.test(man.name)) ok('manifest Spanish'); else bad('manifest');
if (/entreno-esposa-shell-v\d+/.test(sw)) ok('unique SW cache'); else bad('SW cache');
if (plan.includes("name: 'Base'") && plan.includes("name: 'Construcción'")) ok('phases ES'); else bad('phases');
if (!plan.includes('Paavo')) ok('no Paavo in plan'); else bad('Paavo in plan');

if (coach.version !== 1) bad('coach version'); else ok('coach version 1');
if (!coach.feedback || Object.keys(coach.feedback).length) { /* empty ok */ }
{
  // done: vain treenidata (type/km/min/pace/source/hash-id) – ei FC/uni/HRV/painoa julkisessa repossa
  const ALLOWED = ['type', 'km', 'min', 'pace', 'source', 'id'];
  let bads = 0, n = 0;
  Object.keys(coach.done || {}).forEach((d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) bads++;
    (coach.done[d] || []).forEach((e) => { n++; Object.keys(e).forEach((k) => { if (!ALLOWED.includes(k)) bads++; }); });
  });
  if (bads) bad('done has non-workout fields'); else ok('done workout-only (' + n + ' entries)');
}
const dates = (coach.days || []).map(d => d.date);
const need = [
  '2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-31',
  '2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-07',
  '2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-14',
  '2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-21'
];
const missing = need.filter(d => !dates.includes(d));
if (missing.length) bad('missing coach days: ' + missing.join(',')); else ok('20 month-1 coach days');
const strength = coach.days.filter(d => d.type === 'koti');
const runs = coach.days.filter(d => d.type === 'juoksu');
if (strength.length === 8) ok('8 strength'); else bad('strength count ' + strength.length);
if (runs.length === 12) ok('12 runs'); else bad('runs count ' + runs.length);
const titlesOk = coach.days.every(d => d.title && /[áéíóúñÁÉÍÓÚÑa-zA-Z]/.test(d.title));
if (titlesOk) ok('Spanish titles present'); else bad('titles');

// No classic Finnish UI chrome in display files
const fiUi = [/Tänään/, /Kevennä/, /Kovenna/, /Lämmittely/, /Loppuverryttely/,
  /Asetukset/, /Edistyminen/, /Liikkeet/, /Treeni valmis/, /Liike poistettu/,
  /Paina Aloita/, /Seuraava viesti/, />Kaikki</, />Aloita</, /placeholder="esim\./,
  /KEVENNETTY/, /KOVENNETTU/, /Lihashuolto –/, /tai: \$\{/];
const uiFiles = { app, plan, exercises: fs.readFileSync(path.join(ROOT,'exercises.js'),'utf8'),
  progress: fs.readFileSync(path.join(ROOT,'progress.js'),'utf8'), index };
let fiHits = 0;
for (const [name, src] of Object.entries(uiFiles)) {
  for (const re of fiUi) {
    if (re.test(src)) { bad('FI UI in ' + name + ': ' + re); fiHits++; }
  }
}
if (!fiHits) ok('no classic FI UI chrome');
if (app.includes("speakEs") && app.includes("es-ES")) ok('voice es-ES'); else bad('voice not es-ES');
if (app.includes('Todos</button>') && app.includes('Empezar</button>')) ok('ES filter/coach buttons'); else bad('ES buttons');

// HTTP smoke if server up
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    }).on('error', reject);
  });
}

(async () => {
  try {
    const idx = await httpGet('http://127.0.0.1:8766/index.html');
    if (idx.status === 200 && idx.body.includes('Entreno') && idx.body.includes('Hoy')) ok('HTTP index'); else bad('HTTP index ' + idx.status);
    const cp = await httpGet('http://127.0.0.1:8766/coach-plan.json');
    if (cp.status === 200) {
      const j = JSON.parse(cp.body);
      if (j.days && j.days.length === 20) ok('HTTP coach-plan 20 days'); else bad('HTTP coach days');
    } else bad('HTTP coach-plan ' + cp.status);
  } catch (e) {
    console.log('SKIP HTTP (server not up):', e.message);
  }
  if (failed) { console.error('\n' + failed + ' failure(s)'); process.exit(1); }
  console.log('\nAll smoke checks passed');
})();
