/**
 * Node smoke tests – plan + exercises + Garmin CSV
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(file) {
  const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const ctx = { window: {}, global: {}, console, Date, Math, JSON, String, Number, Array, Object, parseFloat, isNaN, encodeURIComponent };
  ctx.global = ctx;
  ctx.window = ctx;
  vm.runInNewContext(code, ctx);
  return ctx;
}

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  OK  ' + msg); }
  else { failed++; console.error(' FAIL ' + msg); }
}

console.log('=== Plan ===');
const planCtx = load('plan.js');
const P = planCtx.TreeniPlan;
ok(!!P, 'TreeniPlan exported');

const settings = {
  raceName: 'Paavo Nurmi Marathon 2027',
  raceDate: '2027-08-21',
  fitnessLevel: 'keskitaso',
  strengthLocation: 'sali'
};
const plan = P.generatePlan(settings, {});
ok(plan.weeks.length >= 8, 'weeks generated: ' + plan.weeks.length);
ok(plan.raceName.includes('Paavo Nurmi'), 'race name baked in');
ok(plan.raceDate === '2027-08-21', 'race date default');

const todayISO = P.toISO(new Date());
const found = P.getDayFromPlan(plan, todayISO);
ok(!!found, 'today found in plan');
ok(found.day.planned && found.day.planned.type, 'today has planned session: ' + found.day.planned.type);

// Strength templates
const gymA = P.STRENGTH.gymA;
const homeA = P.STRENGTH.homeA;
ok(Array.isArray(gymA.exercises) && gymA.exercises.length >= 4, 'gymA structured exercises: ' + gymA.exercises.length);
ok(gymA.exercises.some(e => e.id === 'deadlift'), 'gymA has deadlift id');
ok(gymA.exercises.some(e => e.id === 'back_squat'), 'gymA has back_squat id');
ok(gymA.exercises.some(e => e.id === 'bench_press'), 'gymA has bench_press id');
ok(/Maastaveto/.test(gymA.details), 'gymA details has deadlift');
ok(/Kyykky|kyykky/.test(gymA.details), 'gymA details has squat');
ok(/Penkki|penkki/.test(gymA.details), 'gymA details has bench');
ok(!/haulik|kurtistus|leg curl|sektori/i.test(gymA.details + P.STRENGTH.gymB.details), 'gym avoids isolation sprawl');
ok(/kuminauha|käsipaino|leuanveto|step|ab wheel/i.test(homeA.details), 'homeA uses allowed equipment');
ok(/≤10 kg|10 kg/.test(homeA.details), 'home mentions 10 kg dumbbells');
ok(!/reppu|pullot/i.test(homeA.details + P.STRENGTH.homeB.details), 'home does not use backpack/bottles');
ok(Array.isArray(homeA.exercises) && homeA.exercises.length >= 4, 'homeA structured exercises');

// Collect all exercise ids referenced in plans
const referenced = new Set();
function addExList(list) {
  (list || []).forEach((ex) => {
    referenced.add(ex.id);
    if (ex.altId) referenced.add(ex.altId);
  });
}
['gymA', 'gymB', 'homeA', 'homeB'].forEach((key) => {
  const s = P.STRENGTH[key];
  addExList(s.exercises);
});
// Warm-up / mobility templates
Object.values(P.WARMUP_TEMPLATES || {}).forEach((b) => addExList(b.exercises));
Object.values(P.MOBILITY_TEMPLATES || {}).forEach((b) => addExList(b.exercises));
// Running cue ids + structured blocks from plan days
plan.weeks.forEach((w) => {
  w.days.forEach((d) => {
    const s = d.planned;
    if (!s) return;
    if (s.cueIds) s.cueIds.forEach((id) => referenced.add(id));
    addExList(s.exercises);
    if (s.warmup) addExList(s.warmup.exercises);
    if (s.mobility) addExList(s.mobility.exercises);
  });
});

console.log('=== Exercises ===');
const exCtx = load('exercises.js');
const EX = exCtx.TreeniExercises;
ok(!!EX, 'TreeniExercises exported');
ok(EX.allIds().length >= 30, 'library size: ' + EX.allIds().length);
ok(EX.listExercises('liikkuvuus').length >= 10, 'mobility library: ' + EX.listExercises('liikkuvuus').length);

// Warm-up / mobility on sessions
const runDay = plan.weeks[0].days.find((d) => d.planned && d.planned.type === 'run');
const strDay = plan.weeks[0].days.find((d) => d.planned && d.planned.type === 'strength');
const restDay = plan.weeks[0].days.find((d) => d.planned && d.planned.type === 'rest');
ok(!!runDay && runDay.planned.warmup && runDay.planned.warmup.exercises.length >= 3, 'run has warmup');
ok(!!runDay && runDay.planned.mobility && runDay.planned.mobility.optional, 'run has optional mobility');
ok(!!strDay && strDay.planned.warmup && strDay.planned.warmup.exercises.length >= 3, 'strength has warmup');
ok(!!strDay && strDay.planned.mobility && strDay.planned.mobility.optional, 'strength has optional mobility');
ok(!!restDay && restDay.planned.mobility && restDay.planned.mobility.id === 'mobility_gentle', 'rest has gentle mobility');
ok(!restDay.planned.warmup, 'rest has no mandatory warmup');

const kevW = P.applyKeventa(runDay.planned);
ok(kevW.warmup && kevW.warmup.durationMin <= 5, 'keventa shortens warmup: ' + (kevW.warmup && kevW.warmup.durationMin));
const sickW = P.applySick(runDay.planned);
ok(sickW.mobility && sickW.mobility.id === 'mobility_gentle', 'sick offers gentle mobility');
const swappedW = P.swapLocation(strDay.planned);
ok(swappedW.warmup && swappedW.mobility, 'swap keeps warmup+mobility');

let missing = [];
referenced.forEach((id) => {
  if (!EX.getExercise(id)) missing.push(id);
});
ok(missing.length === 0, 'library covers all plan ids' + (missing.length ? ': missing ' + missing.join(', ') : ' (' + referenced.size + ')'));

// Embed policy
let embeds = 0, links = 0;
EX.listExercises().forEach((e) => {
  ok(!!e.name && !!e.category && Array.isArray(e.benefits) && Array.isArray(e.cues) && Array.isArray(e.mistakes), 'fields ok: ' + e.id);
  ok(e.benefits.length >= 2 && e.cues.length >= 3 && e.mistakes.length >= 2, 'content depth: ' + e.id);
  if (e.video && e.video.type === 'embed') {
    embeds++;
    ok(!!e.video.youtubeId && /^[\w-]{6,}$/.test(e.video.youtubeId), 'embed id: ' + e.id);
    const url = EX.embedUrl(e);
    ok(url && url.startsWith('https://www.youtube-nocookie.com/embed/'), 'nocookie embed: ' + e.id);
  } else {
    links++;
    ok(e.video && e.video.type === 'link' && e.video.url && e.video.url.startsWith('https://'), 'link-out: ' + e.id);
  }
});
ok(embeds >= 4, 'has embeds: ' + embeds);
ok(links >= 1, 'has link-outs: ' + links);

// Modifications preserve structure
const easy = { type: 'run', subtype: 'easy', name: 'Helppo', distanceKm: 10, details: 'x', cueIds: ['easy_run_form'] };
const kev = P.applyKeventa(easy);
ok(Math.abs(kev.distanceKm - 7) < 0.05, 'keventa ~30%: ' + kev.distanceKm);
const kov = P.applyKoventa(easy);
ok(kov.distanceKm > 10, 'koventa increases easy: ' + kov.distanceKm);
const hard = { type: 'run', subtype: 'tempo', name: 'Tempo', distanceKm: 10, details: 'x' };
const kovHard = P.applyKoventa(hard);
ok(kovHard.modified === 'koventa-blocked', 'koventa blocked on tempo');
const sick = P.applySick(easy);
ok(sick.type === 'rest' && sick.subtype === 'sick', 'sick -> rest');
const short = P.applyShortSwap(easy);
ok(short.distanceKm <= 6, 'short swap distance: ' + short.distanceKm);

const strengthSession = {
  type: 'strength',
  subtype: 'gymA',
  name: gymA.name,
  location: 'sali',
  altId: 'homeA',
  details: gymA.details,
  exercises: gymA.exercises,
  restNote: gymA.restNote,
  notes: gymA.notes,
  headline: gymA.headline,
  durationMin: 60
};
const kevS = P.applyKeventa(strengthSession);
ok(kevS.exercises && kevS.exercises.length === gymA.exercises.length, 'keventa keeps exercises');
const shortS = P.applyShortSwap(strengthSession);
ok(shortS.exercises && shortS.exercises.length <= 4, 'short strength trims exercises: ' + (shortS.exercises && shortS.exercises.length));
const swapped = P.swapLocation(strengthSession);
ok(swapped.location === 'koti' && swapped.subtype === 'homeA', 'swap gym->home');
ok(swapped.exercises && swapped.exercises.length >= 4, 'swapped has exercises');
ok(/ab wheel|Goblet|leuanveto/i.test(swapped.details), 'swapped home details present');

console.log('=== Vaihda treeni (swapSessionType) ===');
const fitness = plan.fitness || P.fitnessBaseline('keskitaso', {});
const ctxBase = { weekIndex: 0, phaseId: 'base', fitness, currentSession: strengthSession, deload: false };
const toKoti = P.swapSessionType('koti', ctxBase);
ok(toKoti.type === 'strength' && toKoti.location === 'koti', 'swap->koti location');
ok(toKoti.exercises && toKoti.exercises.length >= 4, 'swap->koti exercises');
ok(toKoti.warmup && toKoti.mobility, 'swap->koti warmup+mobility');
ok(/homeA|homeB/.test(toKoti.subtype), 'swap->koti subtype home: ' + toKoti.subtype);

const toSali = P.swapSessionType('sali', ctxBase);
ok(toSali.type === 'strength' && toSali.location === 'sali', 'swap->sali location');
ok(toSali.exercises && toSali.exercises.length >= 4, 'swap->sali exercises');
ok(/gymA|gymB/.test(toSali.subtype), 'swap->sali subtype gym: ' + toSali.subtype);

const toRun = P.swapSessionType('juoksu', Object.assign({}, ctxBase, { currentSession: strengthSession }));
ok(toRun.type === 'run' && toRun.subtype === 'easy', 'swap strength->juoksu easy');
ok(toRun.distanceKm >= 4 && toRun.distanceKm <= 16, 'swap->juoksu km: ' + toRun.distanceKm);
ok(toRun.warmup && toRun.mobility, 'swap->juoksu prep');

const qualityCur = { type: 'run', subtype: 'tempo', name: 'Tempo', distanceKm: 10, details: 'tempo', cueIds: ['tempo_cues'] };
const keepQ = P.swapSessionType('juoksu', Object.assign({}, ctxBase, { currentSession: qualityCur, phaseId: 'build' }));
ok(keepQ.type === 'run' && keepQ.subtype === 'tempo', 'swap juoksu keeps quality tempo');
ok(keepQ.warmup, 'kept quality has warmup');

const toLiha = P.swapSessionType('lihashuolto', ctxBase);
ok(toLiha.type === 'mobility' && toLiha.subtype === 'lihashuolto', 'swap->lihashuolto type');
ok(toLiha.durationMin >= 20 && toLiha.durationMin <= 30, 'lihashuolto duration');
ok(toLiha.exercises && toLiha.exercises.length >= 6, 'lihashuolto exercises: ' + (toLiha.exercises && toLiha.exercises.length));
ok(toLiha.warmup && toLiha.warmup.exercises.length >= 3, 'lihashuolto has warmup');
const lihaIds = toLiha.exercises.map((e) => e.id);
ok(lihaIds.every((id) => !!EX.getExercise(id)), 'lihashuolto ids in library');
ok(lihaIds.some((id) => (EX.getExercise(id) || {}).category === 'liikkuvuus'), 'lihashuolto uses liikkuvuus');

// Kevennä / kovenna still work after swap
const kevAfter = P.applyKeventa(toKoti);
ok(kevAfter.modified === 'keventa' && kevAfter.exercises, 'keventa after koti swap');
const kovAfter = P.applyKoventa(toRun);
ok(kovAfter.distanceKm > toRun.distanceKm, 'koventa after juoksu swap');

console.log('=== Garmin CSV ===');
const gCtx = load('garmin.js');
const G = gCtx.GarminImport;
ok(!!G, 'GarminImport exported');

const sample = `Activity Type,Date,Title,Distance,Time,Avg HR,Max HR,Avg Pace,Elev Gain
Running,2026-09-01,Morning Run,8.2,0:48:00,142,168,5:51,45
Running,2026-09-03,"Tempo Run",10.5,0:55:20,155,172,5:16,30
Running,2026-09-05,Long Run,18.0,1:45:00,148,165,5:50,120
Running,2026-09-08,Easy,7.0,0:42:00,138,160,6:00,20
Running,2026-09-10,Easy,8.0,0:46:00,140,158,5:45,25
Running,2026-09-12,Long Run,20.0,1:55:00,150,170,5:45,90
Running,2026-09-15,Easy,6.5,0:38:00,135,155,5:50,15
Running,2026-09-20,Easy,9.0,0:52:00,141,160,5:47,40
Cycling,2026-09-21,Ride,40.0,1:30:00,120,145,,200
Strength,2026-09-22,Gym,0,0:45:00,100,130,,
`;

const result = G.importGarminCSV(sample, 6);
ok(result.runs.length === 8, 'parsed 8 runs, got ' + result.runs.length);
ok(result.summary.longestRunKm === 20, 'longest 20 km: ' + result.summary.longestRunKm);
ok(result.summary.avgWeeklyKm > 10, 'avg weekly km: ' + result.summary.avgWeeklyKm);
ok(result.summary.runCount === 8, 'runCount in window');

ok(G.parseDistanceKm('5,2') === 5.2, 'comma decimal');
ok(G.parseDistanceKm('5200') === 5.2, 'meters heuristic');
ok(G.parseDate('2026-09-15') === '2026-09-15', 'ISO date');
ok(G.parseDate('15.09.2026') === '2026-09-15', 'FI date');

const plan2 = P.generatePlan(settings, {
  avgWeeklyKm: result.summary.avgWeeklyKm,
  longestRunKm: result.summary.longestRunKm
});
ok(plan2.fitness.longest >= 15, 'fitness uses garmin longest: ' + plan2.fitness.longest);

console.log('=== Example baseline + volume (no personal data in garmin.js) ===');
ok(!G.TEEMU_GARMIN_BASELINE && !G.getTeemuBaseline, 'no hardcoded personal Garmin baseline');

const teemuSettings = {
  raceName: 'Paavo Nurmi Marathon 2027',
  raceDate: '2027-08-21',
  fitnessLevel: 'aloittelija-keskitaso',
  strengthLocation: 'sali',
  salibandyDow: 5
};
const planT = P.generatePlan(teemuSettings, {
  manualWeeklyKm: 19,
  manualLongestKm: 15.5
});
ok(planT.fitness.weekly === 19, 'example plan weekly: ' + planT.fitness.weekly);
ok(planT.fitness.longest === 15.5, 'example plan longest: ' + planT.fitness.longest);
ok(planT.weeks[0].volumeTargetKm <= 25, 'week0 volume <=25: ' + planT.weeks[0].volumeTargetKm);
ok(planT.weeks[0].volumeTargetKm >= 18, 'week0 volume >=18: ' + planT.weeks[0].volumeTargetKm);
const long0 = planT.weeks[0].days.find(d => d.planned && d.planned.subtype === 'long');
ok(long0 && long0.planned.distanceKm <= 15.5 * 1.1, 'long0 respects ~10% from longest: ' + (long0 && long0.planned.distanceKm));

const tip = P.fourWeekSuggestion(planT.fitness, teemuSettings);
ok(tip && tip.weeks.length === 4, '4-week tip has 4 weeks');
ok(/salibandy|polarisoitu|leuanveto/i.test(tip.textFi), '4-week tip mentions key themes');

const fri = planT.weeks[0].days.find(d => d.dow === 5);
ok(fri && (fri.planned.subtype === 'rest' || fri.planned.subtype === 'salibandy'), 'Friday rest/salibandy: ' + (fri && fri.planned.subtype));
ok(/salibandy/i.test(fri.planned.details || ''), 'Friday notes mention salibandy');

const saliSession = P.applySalibandy({
  type: 'run', subtype: 'tempo', name: 'Tempo', distanceKm: 10, details: 'x'
});
ok(saliSession.subtype === 'easy' && saliSession.salibandyDay, 'applySalibandy softens tempo');

ok(/RPE 6–7/.test(P.STRENGTH.gymA.details), 'gymA has RPE guidance');
ok(/3×3–5|3×3-5/.test(P.STRENGTH.homeA.details), 'homeA pull-up 3×3–5');
ok(/Punnerrus|3×10–15/.test(P.STRENGTH.homeA.details), 'homeA push-up volume');
ok(/scap-pull|kuminauha/i.test(P.STRENGTH.homeA.details), 'homeA band/scap pull guidance');
ok(!!EX.getExercise('push_up'), 'push_up in library');

// Syntax check app.js loads after dependencies
console.log('=== App load ===');
const appCtx = { window: {}, global: {}, console, Date, Math, JSON, String, Number, Array, Object, parseFloat, isNaN, encodeURIComponent, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, document: { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [], querySelector: () => null }, navigator: { onLine: true, serviceWorker: { register: () => Promise.resolve() } }, structuredClone: (o) => JSON.parse(JSON.stringify(o)) };
appCtx.global = appCtx;
appCtx.window = appCtx;
try {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'plan.js'), 'utf8'), appCtx);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'exercises.js'), 'utf8'), appCtx);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'garmin.js'), 'utf8'), appCtx);
  // app.js binds DOMContentLoaded – should not throw on parse/run
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), appCtx);
  ok(true, 'app.js loads without throw');
  ok(!!appCtx.TreeniPlan && !!appCtx.TreeniExercises, 'globals available to app');
} catch (e) {
  ok(false, 'app.js load error: ' + e.message);
}


console.log('=== Duration 60 + pain + wording ===');
const strDay60 = plan.weeks[0].days.find((d) => d.planned && d.planned.type === 'strength' && d.planned.location === 'sali');
ok(!!strDay60 && strDay60.planned.durationMin === 60, 'gym strength duration 60: ' + (strDay60 && strDay60.planned.durationMin));
const homePlan = P.generatePlan(Object.assign({}, settings, { strengthLocation: 'koti' }), {});
const homeDay = homePlan.weeks[0].days.find((d) => d.planned && d.planned.type === 'strength');
ok(!!homeDay && homeDay.planned.durationMin === 60, 'home full strength duration 60: ' + (homeDay && homeDay.planned.durationMin));
const shortDur = P.applyShortSwap(strDay60.planned);
ok(shortDur.durationMin === 25, 'short stays 25: ' + shortDur.durationMin);

ok(typeof P.applyPainSoftening === 'function', 'applyPainSoftening exported');
ok(P.hasActiveKneePain([{ status: 'active', area: 'polvi', notes: 'juoksijan polvi' }]), 'detects knee pain');
ok(!P.hasActiveKneePain([{ status: 'history', area: 'polvi' }]), 'history knee not active');
const softRun = P.applyPainSoftening(
  { type: 'run', subtype: 'tempo', name: 'Tempo', distanceKm: 10, details: 'x' },
  [{ status: 'active', area: 'polvi', severity: 'mild', notes: 'juoksijan polvi' }],
  'aristaa'
);
ok(softRun.painSoftened && softRun.distanceKm < 10, 'pain softens run: ' + softRun.distanceKm);
ok(softRun.subtype === 'easy', 'tempo -> easy when knee aristaa');
const okRun = P.applyPainSoftening(
  { type: 'run', subtype: 'tempo', name: 'Tempo', distanceKm: 10, details: 'x' },
  [{ status: 'active', area: 'polvi', severity: 'mild' }],
  'ok'
);
ok(okRun.subtype === 'tempo' && !okRun.painSoftened, 'knee OK skips softening');
const kneeTip = P.kneeTipCardHtml();
ok(kneeTip && kneeTip.exerciseIds.length >= 4, 'knee tip has exercises');
kneeTip.exerciseIds.forEach((id) => ok(!!EX.getExercise(id), 'knee tip ex in lib: ' + id));

console.log('=== Condition tips (multi) ===');
const expectIds = [
  'runners_knee', 'it_band', 'rotator_cuff', 'achilles',
  'plantar_fasciitis', 'low_back', 'ankle_sprain_acute', 'ankle_sprain_history'
];
expectIds.forEach((id) => ok(!!P.CONDITIONS[id], 'condition defined: ' + id));
ok(P.inferConditionId({ status: 'active', area: 'olkapää', notes: 'kiertäjäkalvo' }) === 'rotator_cuff', 'detect rotator');
ok(P.inferConditionId({ status: 'active', area: 'akilles', notes: '' }) === 'achilles', 'detect achilles');
ok(P.inferConditionId({ status: 'active', area: 'nilkka', notes: 'plantaarifaskiitti' }) === 'plantar_fasciitis' ||
   P.inferConditionId({ status: 'active', area: 'muu', notes: 'plantaarifaskiitti' }) === 'plantar_fasciitis', 'detect plantar');
ok(P.inferConditionId({ status: 'active', area: 'muu', notes: 'plantaarifaskiitti' }) === 'plantar_fasciitis', 'detect plantar notes');
ok(P.inferConditionId({ status: 'active', area: 'selkä', notes: 'alaselkä' }) === 'low_back', 'detect low back');
ok(P.inferConditionId({ status: 'active', area: 'lonkka', notes: 'IT-jänne lateraalinen' }) === 'it_band', 'detect IT');
ok(P.inferConditionId({ status: 'active', area: 'nilkka', notes: 'nyrjähdys' }) === 'ankle_sprain_acute', 'detect ankle acute');
ok(P.inferConditionId({ status: 'history', area: 'nilkka', notes: 'nyrjähdys' }) === 'ankle_sprain_history', 'detect ankle history');

expectIds.forEach((id) => {
  const tip = P.tipCardHtml(id);
  ok(!!tip && tip.exerciseIds.length >= 3, 'tip card ' + id + ' has ex');
  ok(tip.bullets.some((b) => /ei lääketieteellinen|ammattilaisen/i.test(b)), 'disclaimer in ' + id);
  tip.exerciseIds.forEach((eid) => ok(!!EX.getExercise(eid), id + ' lib: ' + eid));
});

const newLib = ['calf_raise_eccentric', 'band_external_rotation', 'scap_squeeze', 'glute_med_side_lie', 'towel_stretch_foot'];
newLib.forEach((id) => ok(!!EX.getExercise(id), 'new lib ex: ' + id));

const ankleSoft = P.applyPainSoftening(
  { type: 'run', subtype: 'tempo', name: 'Tempo', distanceKm: 10, details: 'x' },
  [{ status: 'active', area: 'nilkka', severity: 'mod', notes: 'nyrjähdys eilen' }],
  { ankle_sprain_acute: 'kipea' }
);
ok(ankleSoft.painSoftened && ankleSoft.preferCrossTrain, 'acute ankle prefers cross-train');
ok(ankleSoft.subtype === 'easy', 'acute ankle tempo->easy');

const histAnkleTips = P.allTipCards([{ status: 'history', area: 'nilkka', notes: 'vanha nyrjähdys' }]);
ok(histAnkleTips.some((t) => t.id === 'ankle_sprain_history'), 'history ankle shows tip');
ok(!P.conditionsNeedingPrompt([{ status: 'history', area: 'nilkka', notes: 'nyrjähdys' }]).length, 'history ankle no daily prompt');

const shoulderSoft = P.applyPainSoftening(
  { type: 'strength', name: 'Voima', durationMin: 60, exercises: [{ id: 'overhead_press', label: 'Pystypunnerrus', sets: '3×8' }] },
  [{ status: 'active', area: 'olkapää', severity: 'mild', notes: 'kiertäjäkalvo' }],
  { rotator_cuff: 'aristaa' }
);
ok(shoulderSoft.painSoftened && /Olkapää|olkapää/i.test(shoulderSoft.exercises[0].painNote || shoulderSoft.notes || ''), 'shoulder softens press');

const achSoft = P.applyPainSoftening(
  { type: 'run', subtype: 'intervals', name: 'Interval', distanceKm: 8, details: 'x' },
  [{ status: 'active', area: 'akilles', severity: 'mild', notes: 'tendinopatia' }],
  { achilles: 'aristaa' }
);
ok(achSoft.painSoftened && achSoft.subtype === 'easy', 'achilles softens intervals');

const gHealth = G.extractHealthMetrics(`Height (cm),Weight (kg),Blood Pressure,Sleep
178,74.5,120/80,7:30
`);
ok(gHealth.heightCm === 178 && gHealth.weightKg === 74.5, 'health extract height/weight');
ok(gHealth.bpSys === 120 && gHealth.bpDia === 80, 'health extract BP');
ok(gHealth.sleepHours === 7.5, 'health extract sleep: ' + gHealth.sleepHours);
const gEmpty = G.extractHealthMetrics(sample);
ok(gEmpty.found.length === 0, 'activity CSV has no health columns');

const appSrc = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
ok(appSrc.includes('>Kevennä<') || appSrc.includes('Kevennä</button>'), 'UI Kevennä');
ok(appSrc.includes('Kovenna</button>'), 'UI Kovenna');
ok(appSrc.includes('Vaihda treeni'), 'UI Vaihda treeni');
['swap-koti', 'swap-sali', 'swap-juoksu', 'swap-lihashuolto', 'swap-kavely', 'swap-muu'].forEach((a) =>
  ok(appSrc.includes("'" + a + "'"), 'UI ' + a));
ok(appSrc.includes('applySessionTypeSwap') || appSrc.includes('swapSessionType'), 'UI wires swapSessionType');
ok(appSrc.includes('Salibandy'), 'UI Salibandy preserved');
ok(!/Keventä</.test(appSrc), 'no UI Keventä');
ok(!/>Koventa</.test(appSrc), 'no UI Koventa button');
ok(appSrc.includes('treeni-app-v7'), 'STORAGE_KEY v7');
ok(appSrc.includes('monthlyCheckins'), 'monthlyCheckins state');
ok(appSrc.includes('Kuukausiseuranta'), 'Kuukausiseuranta UI');
ok(appSrc.includes('Ääniohjattu treeni'), 'voice coach UI');
ok(appSrc.includes('Näin käytät sovellusta') || appSrc.includes('APP_USAGE_TIPS'), 'app usage tips');
ok(appSrc.includes('MOTIVATION_LINES') || appSrc.includes('moti-card'), 'motivation blurbs');
ok(appSrc.includes('Kevennä / Kovenna') || appSrc.includes('APP_USAGE_TIPS'), 'usage tip Kevennä');
{
  const m = appSrc.match(/const MOTIVATION_LINES = \[([\s\S]*?)\n  \];/);
  const n = m ? (m[1].match(/^\s*['"].*['"],?\s*$/gm) || []).length : 0;
  ok(n >= 30, 'motivation pool >= 30 lines: ' + n);
  ['MOTIVATION_DONE', 'MOTIVATION_EASED', 'MOTIVATION_SICK', 'MOTIVATION_REST'].forEach((k) =>
    ok(appSrc.includes('const ' + k + ' = ['), 'context pool ' + k));
  ok(appSrc.includes('motivationContext(day)'), 'motivation context wiring');
  const sick = appSrc.match(/const MOTIVATION_SICK = \[([\s\S]*?)\n  \];/);
  ok(sick && /lepo|lepää/i.test(sick[1]) && !/treenaa silti|juokse|lenkkarit/i.test(sick[1]), 'sick pool says rest, no training push');
}
ok(appSrc.includes('21.8.2027') || appSrc.includes('2027-08-21'), 'race date in tips/settings');

ok(appSrc.includes('speechSynthesis'), 'speechSynthesis used');
ok(appSrc.includes('Miten polvi tänään') || (P.CONDITIONS.runners_knee && /polvi/.test(P.CONDITIONS.runners_knee.promptTitle)), 'knee check prompt');
ok(P.CONDITIONS.rotator_cuff.promptTitle.indexOf('olkapää') >= 0, 'shoulder prompt title');
ok(fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8').includes('treeni-shell-v24'), 'SW cache v24');
ok(fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8').includes('progress.js'), 'SW caches progress.js');
ok(appSrc.includes('data-cond-ans') || appSrc.includes('conditionCheck'), 'condition check UI');
ok(appSrc.includes('detectConditionLabel') || appSrc.includes('allTipCards'), 'multi tip wiring');


console.log('=== Progress (kuukausiseuranta) ===');
const progCtx = load('progress.js');
const TP = progCtx.TreeniProgress;
ok(!!TP, 'TreeniProgress exported');
ok(TP.monthKey('2026-09-15') === '2026-09', 'monthKey');
ok(/Syyskuu 2026/i.test(TP.formatMonthFi('2026-09')), 'formatMonthFi fi: ' + TP.formatMonthFi('2026-09'));
ok(TP.weightDelta(77.5, 80) === -2.5, 'weightDelta loss');
ok(TP.formatWeightDelta(-2.5) === '-2.5 kg', 'formatWeightDelta');
ok(TP.formatWeightDelta(0) === '±0 kg', 'formatWeightDelta zero');
ok(TP.weightDelta(null, 80) === null, 'weightDelta null');
const sampleEntries = [
  { id: 'a', date: '2026-09-01', weightKg: 80, photos: [{ id: 'p1', dataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(100), kind: 'front' }] },
  { id: 'b', date: '2026-08-15', weightKg: 82, photos: [] },
  { id: 'c', date: '2026-09-20', weightKg: 79, photos: [{ id: 'p2', dataUrl: 'data:image/jpeg;base64,' + 'B'.repeat(40), kind: 'side' }] }
];
const groups = TP.groupByMonth(sampleEntries);
ok(groups.length === 2, 'groupByMonth count: ' + groups.length);
ok(groups[0].key === '2026-09', 'newest month first');
ok(groups[0].entries[0].id === 'c', 'newest entry first in month');
ok(groups[0].weightKg === 79, 'month weight from newest with weight');
ok(TP.estimateDataUrlBytes(sampleEntries[0].photos[0].dataUrl) > 0, 'estimateDataUrlBytes');
ok(TP.totalPhotoBytes(sampleEntries) > 0, 'totalPhotoBytes');
ok(!TP.overPhotoSoftLimit(sampleEntries), 'soft limit not tripped on tiny sample');
const norm = TP.normalizeEntry({
  date: '2026-09-29', weightKg: '78.2', energy: '6', photos: [
    { dataUrl: 'data:image/jpeg;base64,xx', kind: 'front' },
    { dataUrl: 'data:image/jpeg;base64,yy', kind: 'side' },
    { dataUrl: 'data:image/jpeg;base64,zz', kind: 'front' }
  ], waistCm: '', restingHr: '52'
});
ok(norm.weightKg === 78.2 && norm.energy === 5 && norm.photos.length === 2, 'normalizeEntry clamp');
ok(norm.waistCm === null && norm.restingHr === 52, 'normalize optional metrics');
ok(TP.primaryPhoto(sampleEntries[0], 'front').kind === 'front', 'primaryPhoto prefer');
ok(TP.pickCompareEntry(groups[0]).id === 'c', 'pickCompareEntry prefers photo');
ok(appSrc.includes('compressImageFile') || fs.readFileSync(path.join(__dirname, 'progress.js'), 'utf8').includes('compressImageFile'), 'compress helper');
ok(appSrc.includes('mp-compare') || appSrc.includes('openCompareModal'), 'compare UI wired');
ok(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').includes('progress.js'), 'index loads progress.js');
ok(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8').includes('mp-compare-slider'), 'compare slider CSS');




console.log('=== Vuorotyökalut poistettu / muu liikunta ===');
['suggestTrainingTiming', 'shouldWarnQualityAfterNight', 'buildMinimiYovuoroPackage', 'shouldOfferMinimiPackage',
 'postShiftReminderText', 'computeReadinessIndex', 'SHIFT_LABELS'].forEach((k) => ok(!(k in P), 'plan.js: ' + k + ' removed'));
ok(typeof P.buildOtherActivitySession === 'function', 'buildOtherActivitySession');
ok(typeof P.buildTravelSession !== 'function', 'travel removed from plan');
const walk = P.buildOtherActivitySession('kavely');
ok(walk.type === 'other' && walk.subtype === 'kavely' && walk.lightLoad === true, 'kävely light other');
ok(!walk.hardLoad, 'kävely not hard');
const bike = P.buildOtherActivitySession('pyoraily');
ok(bike.lightLoad && bike.subtype === 'pyoraily', 'pyöräily light');
const swim = P.buildOtherActivitySession('uinti');
ok(swim.lightLoad && /Uinti/i.test(swim.name), 'uinti');
const muu = P.buildOtherActivitySession('muu', { customName: 'Jooga' });
ok(muu.name === 'Jooga' && muu.lightLoad, 'muu custom name');
const floor = P.buildOtherActivitySession('salibandy');
ok(floor.salibandyDay && floor.hardLoad && !floor.lightLoad, 'salibandy hard other');
const swapWalk = P.swapSessionType('kavely', { fitness: { weekly: 19, longest: 14 } });
ok(swapWalk && swapWalk.subtype === 'kavely', 'swap to kävely');
const swapMuu = P.swapSessionType('muu', { customName: 'Soutu' });
ok(swapMuu && swapMuu.name === 'Soutu', 'swap muu with name');

const rec = P.applySalibandyRecovery({
  type: 'run', subtype: 'tempo', name: 'Tempo', distanceKm: 10, details: 'x'
});
ok(rec.salibandyRecovery && rec.subtype === 'easy', 'salibandy recovery softens tempo');
ok(rec.distanceKm <= 7, 'recovery distance capped: ' + rec.distanceKm);
const recStr = P.applySalibandyRecovery({
  type: 'strength', name: 'Voima', durationMin: 60,
  exercises: [{ id: 'back_squat', label: 'Kyykky', sets: '3×8' }]
});
ok(recStr.durationMin === 25 && /salibandy/i.test(recStr.name + recStr.details), 'strength recovery shortened');

ok(!TP.rhrHrvTrend, 'progress.js: rhrHrvTrend removed');
ok(TP.averageMetric([{ energy: 3 }, { energy: 5 }], 'energy') === 4, 'averageMetric');

const norm2 = TP.normalizeEntry({ date: '2026-09-29', hrv: '62', sleepHours: '7.2', restingHr: '52' });
ok(norm2.hrv === 62 && norm2.sleepHours === 7.2, 'normalize hrv/sleep');

ok(!/Vuorokalenteri|Minimi yövuoro|Valmiusindeksi|data-shift|getShift|Töissä \/ vuoro|shift-banner|postShiftBanner|sleepDebt.*select/.test(appSrc), 'UI: shift/vuoro/valmius tools removed');
ok(!/id="mp-hrv"|id="mp-sleep"|id="mp-hr"|id="mp-energy"/.test(appSrc), 'UI: HRV/RHR/uni/energia manual entry removed');
ok(!/csv-file|Garmin CSV -tuonti|Valmiusindeksi|4 viikon ehdotus/.test(appSrc), 'UI: Garmin CSV/4vk tip clutter removed');
ok(!/data-view="settings"/.test(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').split('<nav')[1] || ''), 'settings moved out of bottom nav');
ok((fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').split('<nav')[1].match(/data-view=/g) || []).length === 4, 'bottom nav has 4 tabs');
ok(!appSrc.includes('matka-full') && !appSrc.includes('Matkaviikko'), 'UI matkatreenit removed');
ok(appSrc.includes('swap-kavely') && appSrc.includes('swap-muu'), 'UI muu liikunta swaps');
ok(appSrc.includes('swap-muu') && appSrc.includes('openMuuActivityModal'), 'UI Muu custom');
ok(appSrc.includes('bindExerciseEdit') && appSrc.includes('mutateSessionExercises'), 'exercise edit wired');
ok(/data-ex-act=.vaihda./.test(appSrc), 'Vaihda button');
ok(appSrc.includes('Poista') && appSrc.includes('mutateSessionExercises'), 'Poista + persist');
ok(appSrc.includes('Lisää liike') || appSrc.includes('+ Lisää liike'), 'Lisää liike button');
ok(/s\.type !== 'other' && s\.distanceKm/.test(appSrc), 'progress: light other not counted as run km');

ok(appSrc.includes('applySalibandyNextDayRecovery') || appSrc.includes('applySalibandyRecovery'), 'salibandy recovery wired');
ok(!/WhatsApp/i.test(appSrc) || appSrc.includes('Ei WhatsApp'), 'no WhatsApp feature push');
ok(!/ystävä|kaveri-tila|friend.?share|share mode/i.test(appSrc), 'no friend/share mode');


console.log('=== Garmin other sports mapping ===');
ok(typeof G.classifyActivity === 'function', 'classifyActivity');
ok(G.classifyActivity('Walking') === 'walk', 'Walking → walk');
ok(G.classifyActivity('Cycling') === 'cycle', 'Cycling → cycle');
ok(G.classifyActivity('Swimming') === 'swim', 'Swimming → swim');
ok(G.classifyActivity('Cardio') === 'cardio', 'Cardio → cardio');
ok(G.classifyActivity('Strength') === 'strength', 'Strength → strength');
ok(G.classifyActivity('Running') === 'run', 'Running → run');
ok(G.isLightActivity('walk') && G.isLightActivity('cycle'), 'walk/cycle light');
ok(!G.isLightActivity('run'), 'run not light');
const sample2 = `Activity Type,Date,Title,Distance,Time
Walking,2026-09-02,Evening Walk,4.0,0:45:00
Cycling,2026-09-04,Ride,25.0,1:10:00
Swimming,2026-09-06,Pool,1.5,0:40:00
Cardio,2026-09-07,Elliptical,0,0:30:00
Running,2026-09-08,Easy,8.0,0:48:00
`;
const r2 = G.importGarminCSV(sample2, 6);
ok(r2.summary.walkCount === 1 && r2.summary.cycleCount === 1, 'walk+cycle counts');
ok(r2.summary.swimCount === 1 && r2.summary.cardioCount === 1, 'swim+cardio counts');
ok(r2.runs.length === 1, 'only 1 run in sample2');
ok(r2.others.length === 4, '4 non-run others');
ok(r2.activities.find(a => a.kind === 'walk').lightLoad === true, 'walk lightLoad flag');


console.log('=== Takaisin-nappi ===');
ok(/addEventListener\('popstate', navPopstate\)/.test(appSrc), 'popstate listener registered');
ok(/H\.pushState\(\{ treeni: 1, view: currentView, modal: lvl \}/.test(appSrc), 'openModal pushes history state');
ok(/function closeModalTop\(\)[\s\S]{0,120}navBack\(1\)/.test(appSrc), '✕/backdrop pops history entry');
ok(/overlay\.onclick = \(e\) => \{ if \(e\.target === overlay\) closeModalTop\(\)/.test(appSrc), 'backdrop → closeModalTop');
ok(/if \(name === 'today'\) \{ if \(s\.view && s\.view !== 'today'\) navBackRaw\(1\)/.test(appSrc), 'Tänään returns via history.back');
ok(/modalStack\.push/.test(appSrc), 'nested overlays stacked');
ok(appCtx.TreeniBackup && typeof appCtx.TreeniBackup.importBackup === 'function', 'app loads without History API');

console.log('=== Olkapään kuntoutus (kiertäjäkalvo) ===');
{
  const REHAB = ['codman_pendulum', 'wall_circles', 'wall_walk', 'stick_external_rotation', 'stick_flexion', 'scap_squeeze',
    'iso_external_rotation', 'iso_internal_rotation', 'band_external_rotation', 'band_internal_rotation',
    'side_lying_external_rotation', 'band_row_low', 'cross_body_stretch'];
  REHAB.forEach((id) => {
    const e = EX.getExercise(id);
    ok(!!e && e.rehab === 'shoulder' && !e.loadsShoulder, 'rehab move: ' + id);
    ok(e && e.cues.some((c) => /kivuttomalla alueella/i.test(c)), 'pain-free cue: ' + id);
    ok(e && e.video && /^https:\/\//.test(e.video.url || ''), 'video link: ' + id);
  });
  ok(EX.shoulderRehabExercises().length === REHAB.length, 'shoulderRehabExercises() = ' + EX.shoulderRehabExercises().length);
  const MUST_TAG = ['pullup', 'push_up', 'bench_press', 'incline_bench', 'overhead_press', 'floor_press', 'band_press', 'cable_chest_press',
    'lat_pulldown', 'seated_cable_row', 'bent_over_row', 'inverted_row', 'band_row', 'scap_pull', 'band_assisted_pullup',
    'ab_wheel', 'plank', 'ball_rollout', 'back_squat', 'front_squat', 'deadlift', 'arm_circles', 'childs_pose'];
  MUST_TAG.forEach((id) => ok(EX.loadsShoulder(id), 'tagged loadsShoulder: ' + id));
  ['leg_press', 'wall_sit', 'sl_rdl_bw', 'step_up_bw', 'reverse_crunch', 'lunge', 'single_leg_hip_thrust', 'calf_raise', 'dead_bug']
    .forEach((id) => ok(!!EX.getExercise(id) && !EX.loadsShoulder(id), 'shoulder-safe alt: ' + id));
  ok(P.SHOULDER_REHAB_DAILY.every((x) => EX.getExercise(x.id) && !EX.loadsShoulder(x.id)), 'daily routine ids valid');
  ok(P.CONDITIONS.rotator_cuff.exerciseIds.every((id) => !EX.loadsShoulder(id)), 'rotator tip card has no loading moves');

  const noLoad = (s) => {
    const ids = [].concat(s.exercises || [], (s.warmup && s.warmup.exercises) || [], (s.mobility && s.mobility.exercises) || [])
      .reduce((a, e) => a.concat([e.id, e.altId].filter(Boolean)), []);
    return ids.every((id) => !EX.loadsShoulder(id));
  };
  const variants = [];
  ['gymA', 'gymB', 'homeA', 'homeB'].forEach((k) => {
    const st = P.STRENGTH[k];
    variants.push([k, Object.assign({ type: 'strength', subtype: k, location: /gym/.test(k) ? 'sali' : 'koti', name: st.name, durationMin: 60 }, st, { warmup: P.warmupFor('strength'), mobility: P.mobilityFor('strength') })]);
  });
  ['koti', 'sali', 'lihashuolto', 'juoksu', 'uinti', 'kavely'].forEach((k) =>
    variants.push(['swap-' + k, P.swapSessionType(k, Object.assign({}, ctxBase))]));
  variants.slice().forEach(([k, s]) => {
    variants.push([k + '+kovenna', P.applyKoventa(s)]);
    variants.push([k + '+kevenna', P.applyKeventa(s)]);
    variants.push([k + '+lyhyt', P.applyShortSwap(s)]);
  });
  plan.weeks.slice(0, 4).forEach((w) => w.days.forEach((d) => variants.push(['plan ' + d.date, d.planned])));
  variants.forEach(([k, s]) => {
    const r = P.applyShoulderRehab(s, EX);
    ok(noLoad(r), 'rehab mode removes shoulder-loading: ' + k);
    if (r.type === 'strength') {
      ok(r.exercises.length >= 3 && r.rehabBlock && r.rehabBlock.exercises.length >= 5, 'strength replaced + rehab block: ' + k);
      ok(!/käsipaino|Punnerrus|Leuanveto|Penkki|Ab wheel|Lankku/i.test(r.exercises.map((e) => e.label).join(' ')), 'no loading labels: ' + k);
    }
    ok(JSON.stringify(P.applyShoulderRehab(r, EX)) === JSON.stringify(r), 'idempotent: ' + k);
  });
  const swim = P.applyShoulderRehab(P.buildOtherActivitySession('uinti'), EX);
  ok(swim.subtype === 'kavely' && !/^Uinti/.test(swim.name), 'uinti → kävely');
  const homeR = P.applyShoulderRehab(variants[2][1], EX);
  ok(homeR.exercises.some((e) => e.id === 'wall_sit' || e.id === 'reverse_crunch') && /Olkapäätila/.test(homeR.details), 'home gets leg/core alternatives + note in details');
  const cp0 = P.parseCoachPlan({ version: 9, flags: { shoulderRehab: true, junk: 1 }, days: [{ date: '2026-10-24', type: 'koti', title: 'Piiri', details: 'Leuanveto, punnerrus' }] });
  ok(cp0.flags.shoulderRehab === true && !('junk' in cp0.flags), 'parseCoachPlan reads flags.shoulderRehab');
  ok(P.parseCoachPlan({ days: [] }).flags.shoulderRehab === undefined, 'no flags → none');
  const coachKoti = P.applyShoulderRehab(P.coachDayToSession(cp0.days[0], cp0), EX);
  ok(coachKoti.shoulderNote && coachKoti.rehabBlock && coachKoti.coach, 'coach koti day: note + rehab block, coach kept');
  ok(appSrc.includes('Olkapää: kylmä 15 min 2×/pv · kevyet heilurit ja liikeradat ilman kipua'), 'daily reminder text');
  ok(appSrc.includes('Olkapää (oikea kiertäjäkalvo) – kuntoutustila'), 'settings toggle label');
}

console.log('=== Backup export / import + privacy ===');
{
  const store = {};
  const mkCtx = () => {
    const c = { window: {}, global: {}, console, Date, Math, JSON, String, Number, Array, Object, parseFloat, isNaN, encodeURIComponent,
      localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
      document: { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [], querySelector: () => null },
      navigator: { onLine: true }, structuredClone: (o) => JSON.parse(JSON.stringify(o)) };
    c.global = c; c.window = c;
    ['plan.js', 'exercises.js', 'garmin.js', 'progress.js', 'app.js'].forEach((f) =>
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), c));
    return c;
  };
  const c1 = mkCtx();
  const B = c1.TreeniBackup;
  ok(!!B && typeof B.importBackup === 'function', 'TreeniBackup exposed');
  const s0 = B.getState();
  ok(s0.settings.userName === '' && s0.baseline.timeHalf === '' && s0.baseline.manualWeeklyKm == null, 'generic defaults (no personal baseline)');
  ok(s0.garmin === null, 'no seeded Garmin data');
  ok(s0.settings.raceDate === '2027-08-21', 'default race date kept (public event)');
  const exp = B.buildBackup();
  ok(exp.app === 'treeni-app' && exp.format === 1 && exp.data && !exp.data.planCache, 'export format');
  let threw = false; try { B.parseBackup('nope'); } catch (e) { threw = true; }
  ok(threw, 'invalid JSON rejected');
  threw = false; try { B.parseBackup('{"app":"other","data":{"settings":{}}}'); } catch (e) { threw = true; }
  ok(threw, 'foreign app rejected');
  threw = false; try { B.parseBackup('{"foo":1}'); } catch (e) { threw = true; }
  ok(threw, 'unknown content rejected');
  // round trip
  B.getState().log.push({ date: '2026-10-01', name: 'Testi', type: 'run' });
  const json = B.backupJson();
  Object.keys(store).forEach((k) => delete store[k]);
  const c3 = mkCtx();
  c3.TreeniBackup.importBackup(json);
  ok(c3.TreeniBackup.getState().log.length === 1 && c3.TreeniBackup.getState().log[0].name === 'Testi', 'round-trip restores log');
  ok(!!store['treeni-app-v7'], 'import persisted to localStorage');
  ok(!!c3.TreeniBackup.getState().planCache, 'plan regenerated after import');
  // pasted raw state (no wrapper)
  const c4 = mkCtx();
  c4.TreeniBackup.importBackup(JSON.stringify({ settings: { userName: 'X' } }));
  ok(c4.TreeniBackup.getState().settings.userName === 'X' && c4.TreeniBackup.getState().settings.raceDate === '2027-08-21', 'raw pasted state import merges defaults');
  // legacy backup with old shift / HRV keys still imports
  {
    Object.keys(store).forEach((k) => delete store[k]);
    const cL = mkCtx();
    const legacy = { app: 'treeni-app', format: 1, data: {
      settings: { userName: 'L', postShiftBanner: true, sleepDebt: 3, shiftWork: 'kolmivuoro', salibandyDow: 2 },
      shifts: { '2026-10-20': 'yo' }, dismissedBanners: { 'postShift:2026-10-20': '2026-10-20' },
      dayOverrides: { '2026-10-20': { status: 'toissa', session: { type: 'rest', subtype: 'shift-skip', name: 'Vuoro', details: 'x' } } },
      monthlyCheckins: [{ id: 'm1', date: '2026-10-01', weightKg: 80, hrv: 55, restingHr: 52, sleepHours: 7, energy: 4, photos: [] }]
    } };
    let err = null;
    try { cL.TreeniBackup.importBackup(JSON.stringify(legacy)); } catch (e) { err = e; }
    ok(!err, 'legacy backup (shifts/HRV) imports without error' + (err ? ': ' + err.message : ''));
    const stL = cL.TreeniBackup.getState();
    ok(stL.settings.salibandyDow === 2 && stL.monthlyCheckins[0].hrv === 55, 'legacy backup: data kept');
    ok(!!cL.TreeniCoach.getEffectiveDay('2026-10-20'), 'legacy override day still renders');
  }
  // private personal file, if present (not part of deploy)
  const priv = path.join(__dirname, '..', 'teemu-asetukset.json');
  if (fs.existsSync(priv)) {
    Object.keys(store).forEach((k) => delete store[k]);
    const c5 = mkCtx();
    c5.TreeniBackup.importBackup(fs.readFileSync(priv, 'utf8'));
    const st = c5.TreeniBackup.getState();
    const privRaw = JSON.parse(fs.readFileSync(priv, 'utf8'));
    ok(st.settings.userName === privRaw.data.settings.userName && st.settings.salibandyDow === privRaw.data.settings.salibandyDow && st.settings.marathonGoal === 'alle 4 h', 'private file: settings restored');
    ok(st.baseline.manualWeeklyKm === 19 && st.baseline.manualLongestKm === 16.1 && st.baseline.timeHalf === '1:57:06', 'private file: baseline restored');
    ok(st.baseline.pullUpsStrict === 5 && st.baseline.pushUpsApprox === 35, 'private file: strength baseline');
    ok(st.garmin && st.garmin.summary && st.garmin.summary.avgWeeklyKm === 19 && st.garmin.summary.longestRunKm === 16.1, 'private file: Garmin summary');
    ok(st.planCache.fitness.weekly === 19 && st.planCache.fitness.longest === 16.1, 'private file: plan uses his baseline');
    const sbd = st.planCache.weeks[0].days.find((d) => d.dow === +st.settings.salibandyDow);
    ok(sbd && /salibandy/i.test(sbd.planned.name + ' ' + (sbd.planned.details || '')), 'private file: salibandy day in plan');
    ok(!!c5.TreeniCoach.getEffectiveDay(c5.TreeniPlan.toISO(new Date())), 'private file: app works after import (old keys ignored)');
    // persisted & reloaded
    const c6 = mkCtx();
    ok(c6.TreeniBackup.getState().settings.userName === privRaw.data.settings.userName, 'private file: survives reload');
  }
  // privacy: public static files contain no personal data
  const pub = ['index.html', 'coach-plan.json', 'app.js', 'plan.js', 'exercises.js', 'garmin.js', 'progress.js', 'styles.css', 'sw.js', 'manifest.json', 'icon.svg'];
  const bad = /Teemu|1:57|16\.1\b|HR1[2-7][0-9]|92\.5|18\.8–22\.9|Kolme lasta/i;
  pub.forEach((f) => ok(!bad.test(fs.readFileSync(path.join(__dirname, f), 'utf8')), 'no personal data in ' + f));
  ok(appSrc.includes("title: 'Varmuuskopio'"), 'usage tip: Varmuuskopio');
}


console.log('=== Valmentajan suunnitelma (coach-plan) ===');
{
  const toISO = (d) => d.toISOString().slice(0, 10);
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  const day2 = new Date(); day2.setDate(day2.getDate() + 2);
  const T1 = P.toISO(tom), T2 = P.toISO(day2);
  // file itself
  const cpRaw = fs.readFileSync(path.join(__dirname, 'coach-plan.json'), 'utf8');
  const cp = P.parseCoachPlan(cpRaw);
  ok(cp && cp.days.length >= 5 && cp.version >= 1 && cp.updatedAt, 'coach-plan.json parses');
  ok(!/Teemu|Nyqvist/i.test(cpRaw), 'coach-plan.json has no personal names');
  ok(cp.days.every((d) => P.COACH_TYPES.includes(d.type)), 'coach-plan types valid');
  ok(P.parseCoachPlan('nope') === null && P.parseCoachPlan({ foo: 1 }) === null, 'invalid coach plan rejected');
  const sample = { version: 3, updatedAt: '2026-10-21T19:00:00+03:00', days: [
    { date: T1, type: 'juoksu', subtype: 'long', title: 'Pitkä 10–12 km', distanceKm: 11, details: 'kevyesti',
      warmup: '5 min kävely', cooldown: 'venyttely',
      options: [{ label: 'Kevennetty', distanceKm: 8, details: '8 km' }, { label: 'Kovennettu', distanceKm: 12, details: '12 km' }], note: 'Ego kotiin' },
    { date: T2, type: 'koti', title: 'Kotipiiri', durationMin: 30, details: '3 kierrosta', options: [{ label: 'Kevennetty', details: '2 kierrosta' }] },
    { date: 'bad', type: 'juoksu' }
  ] };
  const ps = P.parseCoachPlan(sample);
  ok(ps.days.length === 2, 'bad dates dropped');
  const cs = P.coachDayToSession(ps.days[0], ps);
  ok(cs.type === 'run' && cs.distanceKm === 11 && cs.coach && cs.coach.options.length === 2, 'coach run session');
  const ks = P.coachDayToSession(ps.days[1], ps);
  ok(ks.type === 'strength' && ks.location === 'koti' && ks.durationMin === 30, 'coach koti session');
  const opt = P.applyCoachOption(cs, 0);
  ok(opt.distanceKm === 8 && opt.modified === 'keventa' && opt.coach.selected === 'Kevennetty', 'coach option applied');
  ok(P.coachKey(ps.days[0]) !== P.coachKey(Object.assign({}, ps.days[0], { details: 'muutettu' })), 'coachKey changes with content');

  // app-level: fetch ok, then fetch fails → cached used
  const store = {};
  let fetchMode = 'ok';
  let fetchCalls = [];
  const mk = () => {
    const c = { window: {}, global: {}, console, Date, Math, JSON, String, Number, Array, Object, parseFloat, isNaN, encodeURIComponent, Promise, setTimeout, clearTimeout,
      localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
      document: { addEventListener: () => {}, getElementById: () => ({ classList: { add() {}, remove() {} }, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, set innerHTML(v) {}, set textContent(v) {} }), querySelectorAll: () => [], querySelector: () => null },
      navigator: { onLine: true }, structuredClone: (o) => JSON.parse(JSON.stringify(o)),
      fetch: (url, opts) => {
        fetchCalls.push({ url, opts });
        if (fetchMode === 'fail') return Promise.reject(new Error('offline'));
        if (fetchMode === '404') return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
        if (fetchMode === 'garbage') return Promise.resolve({ ok: true, json: () => Promise.resolve({ nope: true }) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(sample))) });
      } };
    c.global = c; c.window = c;
    ['plan.js', 'exercises.js', 'garmin.js', 'progress.js', 'app.js'].forEach((f) =>
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), c));
    return c;
  };
  const run = async () => {
    const a = mk();
    const before = a.TreeniCoach.getEffectiveDay(T1);
    ok(before && !before.coach, 'no coach before fetch');
    await a.TreeniCoach.refresh();
    ok(fetchCalls.length === 1 && /coach-plan\.json/.test(fetchCalls[0].url) && fetchCalls[0].opts.cache === 'no-store', 'fetch coach-plan no-store');
    ok(!!store['treeni-coach-plan'], 'coach plan stored in localStorage');
    const d1 = a.TreeniCoach.getEffectiveDay(T1);
    ok(d1.coach && d1.session.coach && d1.session.name === 'Pitkä 10–12 km' && d1.autoPlanned, 'coach day replaces auto plan');
    const far = new Date(); far.setDate(far.getDate() + 20);
    const dFar = a.TreeniCoach.getEffectiveDay(P.toISO(far));
    ok(dFar && !dFar.coach, 'days not in coach plan keep auto plan');
    // Kevennä uses coach option
    a.TreeniCoach.handleAction(T1, 'keventa');
    let e1 = a.TreeniCoach.getEffectiveDay(T1);
    ok(e1.session.distanceKm === 8 && e1.session.coach.selected === 'Kevennetty' && e1.status === 'keventa', 'Kevennä → coach Kevennetty');
    a.TreeniCoach.handleAction(T1, 'coach-reset');
    e1 = a.TreeniCoach.getEffectiveDay(T1);
    ok(e1.session.distanceKm === 11 && !e1.session.coach.selected, 'coach reset');
    a.TreeniCoach.handleAction(T1, 'coach-opt-1');
    e1 = a.TreeniCoach.getEffectiveDay(T1);
    ok(e1.session.distanceKm === 12 && e1.status === 'koventa', 'coach option Kovennettu chosen');
    // Kovenna on koti coach day (has no Kovennettu option) → generic koventa
    a.TreeniCoach.handleAction(T2, 'koventa');
    const e2 = a.TreeniCoach.getEffectiveDay(T2);
    ok(e2.session.modified === 'koventa' && e2.session.coach, 'Kovenna works on coach koti day');
    // Vaihda still works
    a.TreeniCoach.handleAction(T2, 'swap-juoksu');
    const e2b = a.TreeniCoach.getEffectiveDay(T2);
    ok(e2b.session.type === 'run' && !e2b.session.coach, 'Vaihda replaces coach session');
    // Valmis logs coach workout
    a.TreeniCoach.handleAction(T1, 'done');
    const st = JSON.parse(store['treeni-app-v7']);
    ok(st.log[0] && st.log[0].date === T1 && st.log[0].distanceKm === 12 && st.log[0].coach === 'Kovennettu', 'Valmis logs coach workout');
    ok(a.TreeniCoach.getEffectiveDay(T1).completed, 'coach day completed');

    // stale override from auto plan is ignored when coach updates the day
    const b = mk();
    fetchMode = 'fail';
    await b.TreeniCoach.refresh();
    ok(b.TreeniCoach.getPlan() && b.TreeniCoach.getPlan().version === 3, 'fetch failure → cached plan used');
    ok(b.TreeniCoach.getEffectiveDay(T1).coach, 'cached coach day shown offline');
    fetchMode = '404';
    await b.TreeniCoach.refresh();
    ok(b.TreeniCoach.getPlan().version === 3, '404 → cached plan kept');
    fetchMode = 'garbage';
    await b.TreeniCoach.refresh();
    ok(b.TreeniCoach.getPlan().version === 3, 'invalid JSON → cached plan kept');
    // fresh device with no cache and failing fetch → auto plan
    Object.keys(store).forEach((k) => delete store[k]);
    const c = mk();
    fetchMode = 'fail';
    await c.TreeniCoach.refresh();
    ok(c.TreeniCoach.getPlan() === null && !c.TreeniCoach.getEffectiveDay(T1).coach, 'no cache + fetch fail → auto plan');
    // stale override: user keventa'd the auto plan before coach plan arrived
    c.TreeniCoach.handleAction(T1, 'keventa');
    fetchMode = 'ok';
    await c.TreeniCoach.refresh();
    const e3 = c.TreeniCoach.getEffectiveDay(T1);
    ok(e3.coach && e3.session.coach && e3.session.distanceKm === 11, 'stale pre-coach override ignored');
    // sick status survives coach update, as rest
    c.TreeniCoach.handleAction(T2, 'sairas');
    const e4 = c.TreeniCoach.getEffectiveDay(T2);
    ok(e4.status === 'sairas' && e4.session.type === 'rest', 'sick on coach day = rest');
  };
  module.exports._coachRun = run;
}
const swSrc = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
ok(/coach-plan\.json/.test(swSrc) && /no-store/.test(swSrc), 'SW network-first for coach-plan.json');
ok(appSrc.includes("title: 'Valmentajan suunnitelma'"), 'usage tip: Valmentajan suunnitelma');
ok(appSrc.includes('Valmentajalta') && appSrc.includes('Päivitetty'), 'coach label + updated time in UI');

module.exports._shoulderRun = async () => {
  const store = {};
  let payload = null;
  const mk = () => {
    const c = { window: {}, global: {}, console, Date, Math, JSON, String, Number, Array, Object, parseFloat, isNaN, encodeURIComponent, Promise, setTimeout, clearTimeout,
      localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
      document: { addEventListener: () => {}, getElementById: () => ({ classList: { add() {}, remove() {} }, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, set innerHTML(v) {}, set textContent(v) {} }), querySelectorAll: () => [], querySelector: () => null },
      navigator: { onLine: true }, structuredClone: (o) => JSON.parse(JSON.stringify(o)),
      fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(payload))) }) };
    c.global = c; c.window = c;
    ['plan.js', 'exercises.js', 'garmin.js', 'progress.js', 'app.js'].forEach((f) =>
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), c));
    return c;
  };
  const P2 = load('plan.js').TreeniPlan;
  const EX2 = load('exercises.js').TreeniExercises;
  const d = new Date(); d.setDate(d.getDate() + 1);
  const T = P2.toISO(d);
  const days = [{ date: T, type: 'sali', title: 'Sali', details: 'x' }];
  const a = mk();
  // find an auto-plan strength day in the next 14 days (not coach)
  let strIso = null;
  for (let i = 2; i < 16 && !strIso; i++) { const x = new Date(); x.setDate(x.getDate() + i); const iso = P2.toISO(x); const e = a.TreeniCoach.getEffectiveDay(iso); if (e && e.session.type === 'strength') strIso = iso; }
  ok(!!strIso, 'found auto strength day ' + strIso);
  const loading = (s) => (s.exercises || []).some((e) => EX2.loadsShoulder(e.id));
  ok(!a.TreeniShoulder.isActive() && loading(a.TreeniCoach.getEffectiveDay(strIso).session), 'mode off: loading moves present');
  a.TreeniShoulder.setLocal(true);
  ok(a.TreeniShoulder.isActive() && a.TreeniShoulder.state().source === 'local', 'local toggle on');
  const on = a.TreeniCoach.getEffectiveDay(strIso);
  ok(!loading(on.session) && on.session.rehabBlock && on.shoulderRehab, 'mode on: no loading moves, rehab block');
  a.TreeniCoach.handleAction(strIso, 'koventa');
  ok(!loading(a.TreeniCoach.getEffectiveDay(strIso).session), 'Kovenna variant filtered');
  a.TreeniCoach.handleAction(strIso, 'swap-sali');
  ok(!loading(a.TreeniCoach.getEffectiveDay(strIso).session), 'swap-sali filtered');
  a.TreeniCoach.handleAction(strIso, 'swap-koti');
  ok(!loading(a.TreeniCoach.getEffectiveDay(strIso).session), 'swap-koti filtered');
  a.TreeniShoulder.setLog(strIso, 'cold1', true);
  ok(a.TreeniShoulder.log(strIso).cold1 === true && a.TreeniShoulder.log(strIso).cold2 === false && JSON.parse(store['treeni-app-v7']).health.shoulderLog[strIso].cold1, 'per-day cold log persisted');
  // coach flag false wins over local true
  payload = { version: 7, updatedAt: '2026-10-22T00:00:00+03:00', flags: { shoulderRehab: false }, days };
  await a.TreeniCoach.refresh();
  ok(!a.TreeniShoulder.isActive() && a.TreeniShoulder.state().source === 'coach', 'coach flag false wins over local on');
  // coach flag true wins over local false
  a.TreeniShoulder.setLocal(false);
  payload = { version: 8, updatedAt: '2026-10-22T00:00:00+03:00', flags: { shoulderRehab: true }, days };
  await a.TreeniCoach.refresh();
  ok(a.TreeniShoulder.isActive() && a.TreeniShoulder.state().coach === true, 'coach flag true activates (local off)');
  const cd = a.TreeniCoach.getEffectiveDay(T);
  ok(cd.coach && cd.session.rehabBlock && (cd.session.shoulderNote || (cd.session.noGym && cd.session.location === 'koti')), 'coach sali day gets rehab block (+ note, or converted to koti when ei salikorttia)');
  // flag cached offline (new instance reads localStorage)
  const b = mk();
  ok(b.TreeniShoulder.isActive(), 'coach flag survives reload (cached plan)');
  // flag removed → local decides
  payload = { version: 9, updatedAt: '2026-10-22T00:00:00+03:00', days };
  await b.TreeniCoach.refresh();
  ok(!b.TreeniShoulder.isActive() && b.TreeniShoulder.state().source === 'local', 'no coach flag → local (off)');
};

(module.exports._coachRun ? module.exports._coachRun() : Promise.resolve())
  .then(() => module.exports._shoulderRun().catch((e) => ok(false, 'shoulder tests threw: ' + (e && e.stack || e)))).catch((e) => ok(false, 'coach tests threw: ' + e.message)).then(() => {
console.log('\n=== Result: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed ? 1 : 0);
});

// --- Tehdyt treenit (coach-plan done) ---
{
  const TPd = require('./plan.js') && (global.TreeniPlan || globalThis.TreeniPlan);
  const d = TPd.parseCoachDone({ '2026-10-20': [{ type: 'run', km: 7.89, min: 53.4, pace: '6:46', source: 'garmin', id: 'gabc', hr: 150 }, { type: 'xx', id: 'gdef' }, { type: 'walk', km: 2 }], 'bad': [] });
  ok(d['2026-10-20'].length === 2, 'done: id-ton hylätään');
  ok(d['2026-10-20'][0].hr === undefined && d['2026-10-20'][0].km === 7.89 && d['2026-10-20'][0].min === 53, 'done: vain treenidata');
  ok(d['2026-10-20'][1].type === 'other', 'done: tuntematon tyyppi → other');
  ok(!d.bad, 'done: virheellinen pvm hylätään');
  ok(TPd.sessionKind({ type: 'run' }) === 'run' && TPd.sessionKind({ type: 'other', subtype: 'kavely' }) === 'walk', 'sessionKind run/walk');
  ok(TPd.sessionKind({ type: 'rest' }, 'salibandy') === 'floorball' && TPd.sessionKind({ type: 'rest' }) === null, 'sessionKind säbä/lepo');
  ok(TPd.logKind({ type: 'other', name: 'Lepo / kävely' }) === 'walk' && TPd.logKind({ type: 'rest', name: 'Salibandy' }) === 'floorball', 'logKind vanhat merkinnät');
  ok(TPd.parseCoachPlan({ version: 1, days: [], done: { '2026-10-22': [{ type: 'walk', km: 4.31, id: 'g1' }] } }).done['2026-10-22'][0].km === 4.31, 'parseCoachPlan done');
}
