/**
 * Generación de plan – 10k → 16k → 21k + fuerza en casa
 */
(function (global) {
  'use strict';

  const PHASES = {
    base: { id: 'base', name: 'Base', color: '#4a90c8' },
    build: { id: 'build', name: 'Construcción', color: '#1a7f5a' },
    peak: { id: 'peak', name: 'Pico', color: '#d4a017' },
    taper: { id: 'taper', name: 'Descarga', color: '#9b7ed9' }
  };

  const DOW_FI = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'];
  const DOW_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function toISO(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseISO(s) {
    const [y, m, day] = s.split('-').map(Number);
    return new Date(y, m - 1, day);
  }

  function addDays(d, n) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  function daysBetween(a, b) {
    const ms = parseISO(toISO(b)) - parseISO(toISO(a));
    return Math.round(ms / 86400000);
  }

  function startOfWeek(d) {
    // Maanantai alku
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = x.getDay(); // 0=su
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function round1(n) { return Math.round(n * 10) / 10; }

  /** Fitness-tason perusviikkokm ja pitkä lenkki */
  function fitnessBaseline(level, garmin) {
    let weekly = 20;
    let longest = 12;
    if (garmin && garmin.avgWeeklyKm) {
      weekly = garmin.avgWeeklyKm;
      longest = garmin.longestRunKm || weekly * 0.35;
    } else if (level === 'aloittelija') {
      weekly = 18; longest = 10;
    } else if (level === 'aloittelija-keskitaso') {
      // Aloittelija–keskitaso (≈18–20 km/vk)
      weekly = 19; longest = 14;
    } else if (level === 'keskitaso') {
      weekly = 28; longest = 16;
    } else if (level === 'kokenut') {
      weekly = 45; longest = 22;
    }
    if (garmin && garmin.manualWeeklyKm) weekly = garmin.manualWeeklyKm;
    if (garmin && garmin.manualLongestKm) longest = garmin.manualLongestKm;
    // Lähtövolyymi lähellä nykyistä (~20–25), ei hyppyä 35 km:iin
    return { weekly: clamp(weekly, 15, 80), longest: clamp(longest, 8, 35) };
  }

  /**
   * Vaihe: taper 2 vk, peak 3 vk, build 6 vk, loput base.
   * Jos kilpailuun > 20 vk, näytetään base-progressio.
   */
  function getPhase(weeksToRace) {
    if (weeksToRace <= 0) return PHASES.taper;
    if (weeksToRace <= 2) return PHASES.taper;
    if (weeksToRace <= 5) return PHASES.peak;
    if (weeksToRace <= 11) return PHASES.build;
    return PHASES.base;
  }

  function isDeloadWeek(weekIndex) {
    // Deload joka 4. viikko (0-indexed: 3, 7, 11...)
    return weekIndex > 0 && (weekIndex + 1) % 4 === 0;
  }

  /** Progressiivinen pitkä lenkki ~10 % sääntö nykyisestä pisimmästä + deload */
  function longRunKm(baseLongest, weekIndex, weeksToRace, deload) {
    // Aloita hieman alle nykyisen pisimmän (varovainen volyyminosto), kasva ≤10 %/vk
    let startLong = round1(clamp(baseLongest * 0.85, 10, baseLongest));
    let target = startLong;
    const growthWeeks = Math.min(weekIndex, 16);
    for (let i = 0; i < growthWeeks; i++) {
      target = round1(target * 1.08); // ~8 %/vk ≈ alle 10 % säännön
      // älä ylitä nykyistä pisintä + 10 % liian aikaisin
      const softCap = baseLongest * (1 + 0.1 * Math.min(i + 1, 4));
      if (i < 4) target = Math.min(target, softCap);
    }
    // Peak: pidä / hieman nosta
    if (weeksToRace <= 5 && weeksToRace > 2) {
      target = Math.max(target, baseLongest * 1.35);
      target = Math.min(target, 32);
    }
    // Taper
    if (weeksToRace <= 2) {
      target = weeksToRace <= 1 ? Math.min(12, baseLongest * 0.5) : Math.min(18, baseLongest * 0.7);
    }
    if (deload) target *= 0.7;
    return round1(clamp(target, 6, 35));
  }

  function easyRunKm(weeklyTarget, longKm, deload) {
    const remaining = Math.max(weeklyTarget - longKm, 10);
    let easy = remaining / 3;
    if (deload) easy *= 0.75;
    return round1(clamp(easy, 4, 16));
  }

  function weeklyVolumeTarget(baseWeekly, weekIndex, weeksToRace, deload) {
    // Hidas kasvu: ensimmäiset 4 vk pysyvät lähellä ~20–25 km/vk jos baseline ~19
    let v = baseWeekly;
    const growth = Math.min(weekIndex, 14);
    // ~5 %/vk alussa, myöhemmin ~6 %
    for (let i = 0; i < growth; i++) {
      v *= (i < 4 ? 1.04 : 1.055);
    }
    // Älä hyppää yli ~25 km ensimmäisillä 2 viikolla jos baseline ≤22
    if (weekIndex < 2 && baseWeekly <= 22) {
      v = Math.min(v, Math.max(baseWeekly, 22) + weekIndex * 2);
    }
    if (weeksToRace <= 2) v *= weeksToRace <= 1 ? 0.4 : 0.55;
    else if (weeksToRace <= 5) v *= 0.95;
    if (deload) v *= 0.7;
    return round1(clamp(v, 12, 90));
  }

  // --- Fuerzaharjoitukset (strukturoidut exercise-id:t) ---
  function formatStrengthDetails(tmpl) {
    const lines = [tmpl.headline || tmpl.name];
    if (tmpl.equipmentNote) lines.push(tmpl.equipmentNote);
    (tmpl.exercises || []).forEach(function (ex) {
      let line = '• ' + (ex.label || ex.id) + (ex.sets ? ' ' + ex.sets : '');
      if (ex.alt) line += ' (o ' + ex.alt + ')';
      lines.push(line);
    });
    if (tmpl.restNote) lines.push(tmpl.restNote);
    if (tmpl.notes) lines.push(tmpl.notes);
    return lines.join('\n');
  }

  const STRENGTH_RAW = {
    gymA: {
      id: 'gymA',
      name: 'Fuerza A (gym)',
      location: 'sali',
      altId: 'homeA',
      headline: 'Cuerpo completo A – gym (movimientos base, RPE conservador)',
      exercises: [
        { id: 'back_squat', label: 'Sentadilla trasera', sets: '3×6–8 · RPE 6–7' },
        { id: 'bench_press', label: 'Press de banca (barra o mancuernas)', sets: '3×6–8 · RPE 6–7' },
        { id: 'deadlift', label: 'Peso muerto', sets: '3×5 · RPE 6–7' },
        { id: 'lat_pulldown', label: 'Jalón al pecho', sets: '3×8–10 · RPE 6–7', altId: 'seated_cable_row', alt: 'remo en polea baja' },
        { id: 'plank', label: 'Plancha', sets: '3×30–45 s' }
      ],
      restNote: 'Descanso 90–150 s.',
      notes:
        'Cargas conservadoras RPE 6–7 (2–4 repeticiones en reserva) – sin adivinar % de 1RM. ' +
        'Referencia: ~5 dominadas estrictas, ~30–35 flexiones. Mantén la técnica limpia.'
    },
    gymB: {
      id: 'gymB',
      name: 'Fuerza B (gym)',
      location: 'sali',
      altId: 'homeB',
      headline: 'Cuerpo completo B – gym (movimientos base, RPE conservador)',
      exercises: [
        { id: 'front_squat', label: 'Sentadilla frontal', sets: '3×6–8 · RPE 6–7', altId: 'goblet_squat', alt: 'sentadilla goblet' },
        { id: 'incline_bench', label: 'Press inclinado (barra / mancuernas)', sets: '3×8 · RPE 6–7', altId: 'cable_chest_press', alt: 'press de pecho en polea' },
        { id: 'rdl', label: 'Peso muerto rumano', sets: '3×6–8 · RPE 6–7' },
        { id: 'bent_over_row', label: 'Remo inclinado', sets: '3×8 · RPE 6–7', altId: 'seated_cable_row', alt: 'remo sentada en polea' },
        { id: 'ball_rollout', label: 'Rueda / balón abdominal', sets: '3×8–10', altId: 'dead_bug', alt: 'dead bug' }
      ],
      restNote: 'Descanso 90–150 s.',
      notes:
        'RPE 6–7, sin cargas % pesadas. Bloque sencillo. ' +
        'Si el día anterior era floorball: acorta o aligera.'
    },
    homeA: {
      id: 'homeA',
      name: 'Fuerza A (casa)',
      location: 'koti',
      altId: 'gymA',
      headline: 'Cuerpo completo A – casa (dominadas + flexiones)',
      equipmentNote: 'Equipo: bandas, mancuernas ajustables ≤ 10 kg, barra de chin-up, step, rueda abdominal.',
      exercises: [
        { id: 'goblet_squat', label: 'Sentadilla goblet (mancuernas)', sets: '3×10', altId: 'band_squat', alt: 'sentadilla con banda' },
        { id: 'push_up', label: 'Flexiones', sets: '3×10–15', altId: 'floor_press', alt: 'press de suelo / banco con mancuernas' },
        { id: 'rdl_db', label: 'Peso muerto rumano con mancuernas (o banda)', sets: '3×10' },
        { id: 'pullup', label: 'Dominadas (máx. ~5 estrictas)', sets: '3×3–5', altId: 'band_assisted_pullup', alt: 'asistidas con banda / escápulas 3×5–8' },
        { id: 'ab_wheel', label: 'Rueda abdominal (de rodillas ok)', sets: '3×6–10' }
      ],
      restNote: 'Descansa 60–90 s.',
      notes:
        'Dominadas: empieza con escápulas + banda asistida; añade 3–5 estrictas cuando puedas. ' +
        'Flexiones: 3×10–15 con peso corporal; sube repeticiones antes de añadir resistencia. ' +
        'Referencia: ~5 dominadas estrictas / ~30–35 flexiones.'
    },
    homeB: {
      id: 'homeB',
      name: 'Fuerza B (casa)',
      location: 'koti',
      altId: 'gymB',
      headline: 'Cuerpo completo B – casa',
      equipmentNote: 'Equipo: bandas, mancuernas ≤ 10 kg, barra de chin-up, step, rueda abdominal.',
      exercises: [
        { id: 'lunge', label: 'Zancada / step-up (mancuernas)', sets: '3×8/lado' },
        { id: 'push_up', label: 'Flexiones', sets: '3×10–15', altId: 'band_press', alt: 'press con banda / press de hombro' },
        { id: 'single_leg_hip_thrust', label: 'Puente de glúteos a una pierna', sets: '3×8/lado' },
        { id: 'band_row', label: 'Remo con banda', sets: '3×10', altId: 'inverted_row', alt: 'remo invertido con barra' },
        { id: 'scap_pull', label: 'Escápulas / jalón con banda', sets: '3×5–8', altId: 'band_assisted_pullup', alt: 'dominada asistida con banda' },
        { id: 'calf_raise', label: 'Elevación de gemelos en step', sets: '3×12' },
        { id: 'ab_wheel', label: 'Rueda abdominal', sets: '3×6–10', altId: 'plank', alt: 'plancha 3×30–45 s' }
      ],
      restNote: 'Descansa 60–90 s.',
      notes:
        'Usa solo el equipo listado. Flexiones ~3×10–15. ' +
        'Progreso en dominadas: escápulas → asistidas con banda → series de 3–5 estrictas.'
    }
  };

  function finalizeStrength(raw) {
    const s = Object.assign({}, raw);
    s.details = formatStrengthDetails(raw);
    return s;
  }

  const STRENGTH = {
    gymA: finalizeStrength(STRENGTH_RAW.gymA),
    gymB: finalizeStrength(STRENGTH_RAW.gymB),
    homeA: finalizeStrength(STRENGTH_RAW.homeA),
    homeB: finalizeStrength(STRENGTH_RAW.homeB)
  };


  // --- Calentamiento & liikkuvuus ---
  function cloneBlock(b) {
    return JSON.parse(JSON.stringify(b));
  }

  const WARMUP_TEMPLATES = {
    run: {
      id: 'warmup_run',
      label: 'Calentamiento',
      durationMin: 8,
      note: '5-10 min: cardio ligero + movimiento dinámico antes de correr.',
      exercises: [
        { id: 'light_jog', label: 'Trote / caminata suave', sets: '2–3 min' },
        { id: 'leg_swings', label: 'Balanceos de pierna', sets: '10/lado' },
        { id: 'hip_opener', label: 'Aperturas de cadera', sets: '8/lado' },
        { id: 'ankle_mobility', label: 'Movilidad de tobillo', sets: '8/lado' },
        { id: 'worlds_greatest_stretch', label: "World's greatest stretch", sets: '3–4/lado' }
      ]
    },
    strength: {
      id: 'warmup_strength',
      label: 'Calentamiento',
      durationMin: 8,
      note: '5-10 min: cardio ligero + movimiento dinámico antes de la fuerza.',
      exercises: [
        { id: 'light_jog', label: 'Caminata suave / elevación de rodillas', sets: '2 min' },
        { id: 'arm_circles', label: 'Círculos de brazos', sets: '10/dirección' },
        { id: 'thoracic_opener', label: 'Aperturas torácicas', sets: '6/lado' },
        { id: 'bw_squat_warmup', label: 'Sentadilla con peso corporal', sets: '8–10' },
        { id: 'glute_activation', label: 'Activación de glúteos', sets: '10–12' },
        { id: 'worlds_greatest_stretch', label: "World's greatest stretch", sets: '3/lado' }
      ]
    }
  };

  const MOBILITY_TEMPLATES = {
    run: {
      id: 'mobility_run',
      label: 'Movilidad / estiramiento',
      optional: true,
      teeMyos: true,
      durationMin: 8,
      note: 'Enfriamiento opcional después; puedes saltártelo.',
      exercises: [
        { id: 'calf_stretch', label: 'Estiramiento de gemelos', sets: '20–30 s/lado' },
        { id: 'hip_flexor_stretch', label: 'Estiramiento del flexor de cadera', sets: '20–40 s/lado' },
        { id: 'quad_stretch', label: 'Estiramiento de cuádriceps', sets: '20–30 s/lado' },
        { id: 'hamstring_stretch', label: 'Estiramiento de isquiotibiales', sets: '20–30 s/lado' },
        { id: 'figure4_stretch', label: 'Figure-4 / piriforme', sets: '20–40 s/lado' }
      ]
    },
    strength: {
      id: 'mobility_strength',
      label: 'Movilidad / estiramiento',
      optional: true,
      teeMyos: true,
      durationMin: 6,
      note: 'Opcional: hazla si tienes tiempo, o sáltatela.',
      exercises: [
        { id: 'hip_flexor_stretch', label: 'Estiramiento del flexor de cadera', sets: '20–30 s/lado' },
        { id: 'thoracic_opener', label: 'Aperturas torácicas', sets: '6/lado' },
        { id: 'hamstring_stretch', label: 'Estiramiento de isquiotibiales', sets: '20–30 s/lado' },
        { id: 'childs_pose', label: 'Postura del niño', sets: '30–60 s' }
      ]
    },
    gentle: {
      id: 'mobility_gentle',
      label: 'Movilidad suave',
      optional: true,
      teeMyos: true,
      durationMin: 10,
      note: 'Opción suave en día de descanso / malestar. Sin entreno – solo movimiento y respiración.',
      exercises: [
        { id: 'cat_cow', label: 'Gato–vaca', sets: '8–12' },
        { id: 'thoracic_opener', label: 'Aperturas torácicas', sets: '6/lado' },
        { id: 'hip_opener', label: 'Aperturas de cadera', sets: '6/lado' },
        { id: 'childs_pose', label: 'Postura del niño', sets: '45–60 s' },
        { id: 'calf_stretch', label: 'Estiramiento de gemelos (suave)', sets: '20 s/lado' }
      ]
    }
  };

  function warmupFor(kind, shortened) {
    const base = cloneBlock(WARMUP_TEMPLATES[kind] || WARMUP_TEMPLATES.run);
    if (shortened) {
      base.durationMin = 5;
      base.note = 'Calentamiento acortado (~5 min) al suavizar.';
      base.exercises = base.exercises.slice(0, Math.min(4, base.exercises.length));
    }
    return base;
  }

  function mobilityFor(kind) {
    return cloneBlock(MOBILITY_TEMPLATES[kind] || MOBILITY_TEMPLATES.run);
  }

  function attachPrep(session) {
    if (!session) return session;
    if (session.type === 'run' || session.type === 'race') {
      session.warmup = warmupFor('run', false);
      session.mobility = mobilityFor('run');
    } else if (session.type === 'strength') {
      session.warmup = warmupFor('strength', false);
      session.mobility = mobilityFor('strength');
    } else if (session.type === 'rest') {
      session.mobility = mobilityFor('gentle');
      // no mandatory warmup on rest
    }
    return session;
  }

  function strengthFor(weekIndex, preferLocation) {
    const isA = weekIndex % 2 === 0;
    if (preferLocation === 'koti') {
      return isA ? { ...STRENGTH.homeA } : { ...STRENGTH.homeB };
    }
    return isA ? { ...STRENGTH.gymA } : { ...STRENGTH.gymB };
  }

  function shortStrength(s) {
    const exercises = (s.exercises || []).slice(0, 4).map(function (ex) {
      return Object.assign({}, ex, { sets: '2×8–10' });
    });
    const base = Object.assign({}, s, {
      name: s.name + ' – corto',
      exercises: exercises,
      restNote: 'Descansa 60 s.',
      notes: 'Acortado 20-25 min. Objetivo: mantener la rutina, no desgastar.',
      headline: 'Acortado 20–25 min'
    });
    base.details = formatStrengthDetails(base);
    return base;
  }

  function qualitySession(phase, fitness) {
    if (phase.id === 'base') {
      return {
        type: 'run',
        subtype: 'strides',
        name: 'Fácil + aceleración',
        distanceKm: round1(fitness.weekly * 0.2),
        cueIds: ['easy_run_form', 'strides_cues'],
        details:
          'Ritmo fácil + 4–6 × 20 s de aceleraciones\n' +
          'Recuperación caminando / trotando 60-90 s entre aceleraciones.\n' +
          'Sensación ligera, sin anaeróbico.'
      };
    }
    if (phase.id === 'build') {
      return {
        type: 'run',
        subtype: 'tempo',
        name: 'Tempo / umbral',
        distanceKm: round1(clamp(fitness.weekly * 0.22, 6, 14)),
        cueIds: ['tempo_cues', 'easy_run_form'],
        details:
          '10–15 min calentamiento → 20–30 min tempo estable\n' +
          '(al límite de hablar, sin sprint) → 10 min enfriamiento.\n' +
          'Alternativa: 3–4 × 6–8 min tempo, 2 min de recuperación.'
      };
    }
    if (phase.id === 'peak') {
      return {
        type: 'run',
        subtype: 'intervals',
        name: 'Intervalos',
        distanceKm: round1(clamp(fitness.weekly * 0.2, 6, 12)),
        cueIds: ['interval_cues'],
        details:
          'Calentamiento 15 min → 5–6 × 3–4 min vivos\n' +
          '(sensación de ritmo de 10k) / 2 min trote → enfriamiento.\n' +
          'O 8-10 × 400-600 m si está disponible.'
      };
    }
    // taper
    return {
      type: 'run',
      subtype: 'strides',
      name: 'Fácil + aceleraciones',
      distanceKm: 6,
      cueIds: ['strides_cues', 'easy_run_form'],
      details:
        'Fácil 5–6 km + 4 × 15–20 s aceleración suave.\n' +
        'Mantenga la luz - semana de competición / grabador.'
    };
  }

  /**
   * Semanarakenne (ma–su):
   * ma: helppo TAI lepo
   * ti: voima
   * ke: laatu / helppo
   * to: voima (tai lyhyt helppo)
   * pe: lepo / helppo
   * la: pitkä
   * su: helppo TAI voima (vaihtoehto)
   */
  function buildWeekPlan(weekStart, weekIndex, raceDate, settings, fitness) {
    const weeksToRace = Math.ceil(daysBetween(weekStart, raceDate) / 7);
    const phase = getPhase(weeksToRace);
    const deload = isDeloadWeek(weekIndex) && phase.id !== 'taper';
    const vol = weeklyVolumeTarget(fitness.weekly, weekIndex, weeksToRace, deload);
    const longKm = longRunKm(fitness.longest, weekIndex, weeksToRace, deload);
    const easyKm = easyRunKm(vol, longKm, deload);
    const prefer = settings.strengthLocation || 'sali';
    const quality = qualitySession(phase, fitness);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const iso = toISO(date);
      const dow = date.getDay(); // 0=su ... 6=la
      let session = null;

      // ma (1): helppo
      if (dow === 1) {
        session = {
          type: 'run',
          subtype: 'easy',
          name: 'Conexión fácil',
          distanceKm: easyKm,
          cueIds: ['easy_run_form'],
          details: `Ritmo fácil unos ${easyKm} km.\nRespiración calmada, puedes hablar todo el rato.\nSi estás cansada: acorta 30 % o camina a trozos ok.`
        };
      }
      // ti (2): voima
      else if (dow === 2) {
        const s = strengthFor(weekIndex, prefer);
        session = {
          type: 'strength',
          subtype: s.id,
          name: s.name,
          location: s.location,
          altId: s.altId,
          details: s.details,
          exercises: s.exercises,
          restNote: s.restNote,
          notes: s.notes,
          headline: s.headline,
          equipmentNote: s.equipmentNote,
          durationMin: 60
        };
      }
      // ke (3): laatu
      else if (dow === 3) {
        session = {
          type: 'run',
          subtype: quality.subtype,
          name: quality.name,
          distanceKm: quality.distanceKm,
          cueIds: quality.cueIds,
          details: quality.details
        };
      }
      // to (4): voima B / toinen voima
      else if (dow === 4) {
        const s = strengthFor(weekIndex + 1, prefer);
        session = {
          type: 'strength',
          subtype: s.id,
          name: s.name,
          location: s.location,
          altId: s.altId,
          details: s.details,
          exercises: s.exercises,
          restNote: s.restNote,
          notes: s.notes,
          headline: s.headline,
          equipmentNote: s.equipmentNote,
          durationMin: 60
        };
      }
      // pe (5): lepo
      else if (dow === 5) {
        session = {
          type: 'rest',
          subtype: 'rest',
          name: 'Descanso / recuperación',
          details:
            'Descanso total o caminata suave 20–30 min.\n' +
            'Buen sueño y nutrición - en el trabajo de turno esto es importante.'
        };
      }
      // la (6): pitkä
      else if (dow === 6) {
        session = {
          type: 'run',
          subtype: 'long',
          name: 'Tirada larga',
          distanceKm: longKm,
          cueIds: ['long_run_cues', 'easy_run_form'],
          details:
            `Tirada larga de unos ${longKm} km.\n` +
            'Empieza con calma, mantén un ritmo fácil todo el recorrido.\n' +
            'Trae una copa si son más de 90 minutos. Los Walker están bien.'
        };
      }
      // su (0): helppo / aktiivinen palautus
      else if (dow === 0) {
        const shortEasy = round1(easyKm * 0.7);
        session = {
          type: 'run',
          subtype: 'easy',
          name: 'Enlace reversible',
          distanceKm: shortEasy,
          cueIds: ['easy_run_form'],
          details: `Suave ${shortEasy} km o, si prefieres, descanso.\nSi la tirada larga fue dura: descanso hoy.`
        };
      }

      // Floorball-ilta: kova kuormituspäivä – älä pidä laatutreeniä samana / seuraavana aamuna
      const saliDow = settings.salibandyDow;
      const saliSet = saliDow !== null && saliDow !== undefined && saliDow !== '' && saliDow !== 'none';
      if (saliSet && session) {
        const sd = +saliDow;
        if (dow === sd) {
          // Floorball-päivä: merkitse ja korvaa laatu/kova juoksu helpolla tai levolla
          if (session.type === 'run' && (session.subtype === 'tempo' || session.subtype === 'intervals' || session.subtype === 'strides')) {
            session = {
              type: 'run',
              subtype: 'easy',
              name: 'Fácil (noche de floorball)',
              distanceKm: round1(Math.min(easyKm, 6)),
              cueIds: ['easy_run_form'],
              details:
                'Noche de floorball = día duro de TE.\n' +
                'Qualituren se movió / se perdió. Si corres, ten mucha luz (~' + round1(Math.min(easyKm, 6)) + ' km).\n' +
                'Floorball es suficiente para un disco duro de una semana.'
            };
          } else if (session.type === 'rest') {
            session = Object.assign({}, session, {
              name: 'Floorball / descanso',
              subtype: 'salibandy',
              details:
                (session.details || '') +
                '\n\n🏒 Noche de floorball: márcalo hecho si jugaste. Cuenta como entreno duro (TE hasta 5.0).'
            });
          } else if (session.type === 'strength') {
            // Floorball on päivän kova ärsyke – ei raskasta voimaa samaan päivään
            session = {
              type: 'rest',
              subtype: 'salibandy',
              name: 'Floorball',
              details:
                '🏒 Noche de floorball = el entreno del día (carga dura).\n' +
                'No hay poder el mismo día. Calentar bien antes del juego y estirar después.',
              mobility: mobilityFor('gentle')
            };
          } else if (session.type === 'run' && session.subtype === 'easy') {
            session = Object.assign({}, session, {
              name: session.name + ' (noche de floorball)',
              details:
                (session.details || '') +
                '\n\n🏒 Noche de floorball: acorta o salta la carrera si el partido fue duro.'
            });
          }
          session.salibandyDay = true;
        }
        // Seuraava aamu salibandyn jälkeen: kevennä laatua
        const nextAfterGym = (sd + 1) % 7;
        if (dow === nextAfterGym && session.type === 'run' &&
            (session.subtype === 'tempo' || session.subtype === 'intervals')) {
          session = {
            type: 'run',
            subtype: 'easy',
            name: 'Fácil (retorno tras el floorball)',
            distanceKm: round1(Math.min(easyKm, 7)),
            cueIds: ['easy_run_form'],
            details:
              'El floorball de ayer fue carga dura.\n' +
              'Tranquilo hoy (~' + round1(Math.min(easyKm, 7)) + 'km) - entrenamiento de calidad en el segundo día.'
          };
        }
      }

      // Semanahuomio kaikkiin päiviin (suunnitelmamuistiinpano)
      if (session && session.details && weekIndex === 0 && i === 0) {
        // annotated on first day only via week tip; also stamp long run
      }
      if (session && session.subtype === 'long') {
        session.details = (session.details || '') +
          '\n\nNota: el floorball cuenta como día duro – no apiles calidad + larga + floorball el mismo fin de semana.';
      }

      // Taper: vähennä ti-voimaa kevyeksi
      if (phase.id === 'taper' && session && session.type === 'strength') {
        const shortened = shortStrength(session);
        session = Object.assign({}, shortened, {
          type: 'strength',
          subtype: session.subtype,
          location: session.location,
          altId: session.altId,
          durationMin: 25
        });
      }

      // Kilpailupäivä
      if (iso === toISO(raceDate)) {
        session = {
          type: 'race',
          subtype: 'marathon',
          name: 'Meta 21k 🏁',
          distanceKm: 21.1,
          details:
            'Día de meta – Media maratón 21k.\n' +
            'Confía en el entrenamiento. Empieza con calma.\n' +
            'Disfruta el camino. ¡Ánimo!'
        };
      }

      if (session) attachPrep(session);

      days.push({
        date: iso,
        dow,
        dowLabel: DOW_FULL[dow],
        weekIndex,
        phase: phase.id,
        phaseName: phase.name,
        deload,
        planned: session,
        // Runtime fields filled by app:
        status: null,
        completed: false,
        modified: null,
        note: ''
      });
    }

    return {
      weekStart: toISO(weekStart),
      weekIndex,
      weeksToRace,
      phase: phase.id,
      phaseName: phase.name,
      deload,
      volumeTargetKm: vol,
      days
    };
  }

  /**
   * Generoi näkyvän suunnitelman: tästä viikosta eteenpäin
   * max 16 viikkoa TAI kilpailuun asti.
   */
  function generatePlan(settings, garmin) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const raceDate = parseISO(settings.raceDate || '2027-06-15');
    const fitness = fitnessBaseline(settings.fitnessLevel || 'keskitaso', garmin);
    const week0 = startOfWeek(today);

    // weekIndex suhteessa "ohjelman alkuun" – käytä viikkoja kilpailuun
    // käänteisesti: mitä lähempänä kisaa, sitä korkeampi "progressio"
    // Käytännössä: laske montako viikkoa on kulunut hypoteettisesta 20 vk ohjelmasta
    const totalWeeksToRace = Math.max(1, Math.ceil(daysBetween(week0, raceDate) / 7));
    const programLength = 20;
    const baseWeekOffset = Math.max(0, programLength - totalWeeksToRace);

    const weeksToShow = Math.min(16, totalWeeksToRace + 1);
    const weeks = [];
    for (let w = 0; w < weeksToShow; w++) {
      const ws = addDays(week0, w * 7);
      if (ws > addDays(raceDate, 7)) break;
      weeks.push(buildWeekPlan(ws, baseWeekOffset + w, raceDate, settings, fitness));
    }

    return {
      generatedAt: new Date().toISOString(),
      raceDate: toISO(raceDate),
      raceName: settings.raceName || 'Media maratón 21k (meta)',
      fitness,
      weeks
    };
  }

  function getDayFromPlan(plan, isoDate) {
    for (const w of plan.weeks) {
      for (const d of w.days) {
        if (d.date === isoDate) return { day: d, week: w };
      }
    }
    return null;
  }

  function applyKeventa(session) {
    if (!session) return session;
    const s = JSON.parse(JSON.stringify(session));
    s.modified = 'keventa';
    if (s.type === 'run' && s.distanceKm) {
      s.distanceKm = round1(s.distanceKm * 0.7);
      s.name = s.name + ' (suavizado)';
      s.details = 'SUAVIZADO (−30 %)\n' + (s.details || '') +
        `\n→ Distancia unos ${s.distanceKm} km, mantén ritmo fácil.`;
      s.warmup = warmupFor('run', true);
    } else if (s.type === 'strength') {
      s.durationMin = Math.round((s.durationMin || 60) * 0.7);
      s.name = s.name + ' (suavizado)';
      if (s.exercises && s.exercises.length) {
        s.exercises = s.exercises.map(function (ex) {
          return Object.assign({}, ex, { sets: '2 sets (ligero)' });
        });
        s.notes = 'SUAVIZADO (−30 %). Haz 2 series / ejercicio con carga un poco más ligera. ' + (s.notes || '');
        s.details = formatStrengthDetails(s);
      } else {
        s.details = 'SUAVIZADO (−30 % series/reps)\n' +
          'Haz 2 series / ejercicio, con carga un poco más ligera.\n' +
          (s.details || '');
      }
      s.warmup = warmupFor('strength', true);
    } else if (s.type === 'mobility') {
      s.durationMin = Math.round((s.durationMin || 25) * 0.7);
      s.name = (s.name || 'Mantenimiento muscular') + ' (suavizado)';
      if (s.exercises && s.exercises.length > 5) {
        s.exercises = s.exercises.slice(0, 5);
      }
      s.details = 'SUAVIZADO – mantenimiento muscular más corto (~' + s.durationMin + ' min).\n' + (s.details || '');
      if (s.warmup) s.warmup = warmupFor('strength', true);
    }
    return s;
  }

  function applyKoventa(session) {
    if (!session) return session;
    const hard = session.subtype === 'tempo' || session.subtype === 'intervals' ||
      session.subtype === 'long' || session.type === 'race';
    if (hard) {
      const s = JSON.parse(JSON.stringify(session));
      s.modified = 'koventa-blocked';
      s.details = (s.details || '') +
        '\n\nNota: este entreno no se intensifica – ya es exigente. Mantén el plan.';
      return s;
    }
    const s = JSON.parse(JSON.stringify(session));
    s.modified = 'koventa';
    if (s.type === 'run' && s.distanceKm) {
      s.distanceKm = round1(s.distanceKm * 1.12);
      s.name = s.name + ' (intensificado)';
      s.details = 'UN POCO INTENSIFICADO (+12 %)\n' + (s.details || '') +
        `\n→ Distancia unos ${s.distanceKm} km. Ritmo aún controlado.`;
    } else if (s.type === 'strength') {
      s.name = s.name + ' (intensificado)';
      if (s.exercises && s.exercises.length) {
        s.notes = 'INTENSIFICADO: +1 serie en los principales O +5–10 % de carga. ' + (s.notes || '');
        s.details = formatStrengthDetails(s);
      } else {
        s.details = 'UN POCO INTENSIFICADO\n' +
          'Añade +1 serie a los principales O +5–10 % de carga.\n' +
          (s.details || '');
      }
    }
    return s;
  }

  function applyShortSwap(session) {
    if (!session) return session;
    const s = JSON.parse(JSON.stringify(session));
    s.modified = 'lyhyt';
    if (s.type === 'run') {
      const km = round1(clamp((s.distanceKm || 8) * 0.4, 3, 6));
      s.distanceKm = km;
      s.name = 'Enlace corto (20-30 min)';
      s.details =
        `Versión corta por turnos: unos ${km} km / 20–30 min.\n` +
        'Ritmo fácil. Mejor entreno corto que nada.';
      s.subtype = 'easy-short';
      s.warmup = warmupFor('run', true);
      s.mobility = mobilityFor('run');
    } else if (s.type === 'strength') {
      const short = shortStrength(Object.assign({}, s, {
        name: s.name.replace(' (suavizado)', '').replace(' (intensificado)', '').replace(' – corto', '').replace(' – lyhyt', '')
      }));
      const out = Object.assign({}, short, {
        type: 'strength',
        subtype: s.subtype,
        location: s.location,
        altId: s.altId,
        durationMin: 25,
        modified: 'lyhyt'
      });
      out.warmup = warmupFor('strength', true);
      out.mobility = mobilityFor('strength');
      return out;
    } else if (s.type === 'mobility') {
      s.durationMin = 15;
      s.name = 'Cuidado muscular – corto';
      if (s.exercises && s.exercises.length > 5) s.exercises = s.exercises.slice(0, 5);
      s.details = 'Mantenimiento muscular corto ~15 min: dinámica + pocos estiramientos.';
      if (s.warmup) s.warmup = warmupFor('strength', true);
    } else if (s.type === 'rest') {
      s.details = 'Restos de descanso - la recuperación es parte del plan.';
    }
    return s;
  }

  function swapLocation(session) {
    if (!session || session.type !== 'strength') return session;
    const map = {
      gymA: STRENGTH.homeA, gymB: STRENGTH.homeB,
      homeA: STRENGTH.gymA, homeB: STRENGTH.gymB
    };
    const alt = map[session.subtype] || map[session.altId];
    if (!alt) return session;
    const swapped = {
      type: 'strength',
      subtype: alt.id,
      name: alt.name,
      location: alt.location,
      altId: alt.altId,
      details: alt.details,
      exercises: alt.exercises,
      restNote: alt.restNote,
      notes: alt.notes,
      headline: alt.headline,
      equipmentNote: alt.equipmentNote,
      durationMin: session.durationMin || 60,
      modified: session.modified || 'sijainti'
    };
    // Säilytä kevennetty lämmittely jos oli kevennetty
    const shortened = session.modified === 'keventa' || session.modified === 'lyhyt';
    swapped.warmup = warmupFor('strength', !!shortened);
    swapped.mobility = mobilityFor('strength');
    return swapped;
  }

  /**
   * Ei salikorttia: entreno de gym → vastaava kotipiiri (A↔A, B↔B). Entrenadorn salipäivä
   * korvataan kotipiirillä, valmentajan muistiinpano säilyy. Muut sessiot ennallaan.
   */
  function noGymSession(session, weekIndex) {
    if (!session || session.type !== 'strength' || session.location !== 'sali') return session;
    const known = session.subtype === 'gymA' || session.subtype === 'gymB' ||
      session.altId === 'homeA' || session.altId === 'homeB';
    let home;
    if (known && !session.coach) {
      home = swapLocation(session);
      if (session.modified === 'keventa' || session.modified === 'lyhyt' || /lyhyt/i.test(session.name || '')) {
        home = Object.assign(shortStrength(home), { warmup: home.warmup, mobility: home.mobility, location: 'koti' });
      }
      home.modified = session.modified || 'ei-salia';
    } else {
      const tmpl = strengthFor(typeof weekIndex === 'number' ? weekIndex : 0, 'koti');
      home = buildStrengthSession(tmpl, session.durationMin || 45);
      home.modified = 'ei-salia';
      if (session.coach) {
        home.coach = Object.assign({}, session.coach, { options: [] });
        home.name = 'Casapiri (en lugar de salitren)';
      }
    }
    home.noGym = true;
    home.details = '🏠 Sin gym → versión casa' +
      (session.coach ? '(El ritual de caza:' + (session.name || '') + ')' : '') + '.\n' + (home.details || '');
    return home;
  }

  /**
   * Cambiar päivän treenityyppi yhdellä napilla.
   * kind: 'koti' | 'sali' | 'juoksu' | 'lihashuolto' | 'kavely' | 'pyoraily' | 'uinti' | 'salibandy' | 'muu'
   * ctx: { weekIndex, phaseId|phase, fitness, currentSession, deload }
   */
  function buildStrengthSession(tmpl, durationMin) {
    const s = {
      type: 'strength',
      subtype: tmpl.id,
      name: tmpl.name,
      location: tmpl.location,
      altId: tmpl.altId,
      details: tmpl.details,
      exercises: (tmpl.exercises || []).map(function (ex) { return Object.assign({}, ex); }),
      restNote: tmpl.restNote,
      notes: tmpl.notes,
      headline: tmpl.headline,
      equipmentNote: tmpl.equipmentNote,
      durationMin: durationMin || 60,
      modified: 'tyyppi'
    };
    attachPrep(s);
    return s;
  }

  function buildEasyRunSession(fitness, deload, phaseId) {
    const weekly = (fitness && fitness.weekly) || 19;
    const longest = (fitness && fitness.longest) || 14;
    const vol = weeklyVolumeTarget(weekly, 0, 40, !!deload);
    const longKm = longRunKm(longest, 0, 40, !!deload);
    let km = easyRunKm(vol, longKm, !!deload);
    // Vaihekohtainen säätö: taper lyhyempi, peak hieman pidempi helppo
    if (phaseId === 'taper') km = round1(clamp(km * 0.75, 4, 8));
    else if (phaseId === 'peak') km = round1(clamp(km, 5, 12));
    else if (phaseId === 'build') km = round1(clamp(km, 5, 14));
    else km = round1(clamp(km, 4, 12));
    const s = {
      type: 'run',
      subtype: 'easy',
      name: 'Conexión fácil',
      distanceKm: km,
      cueIds: ['easy_run_form'],
      details:
        'Ritmo fácil n.' + km + ' km.\n' +
        'Respiración calmada, puedes hablar todo el rato.\n' +
        'Cambia a la práctica diaria... mantén la luz.',
      modified: 'tyyppi'
    };
    attachPrep(s);
    return s;
  }

  function buildLihashuoltoSession() {
    // ~20–30 min: dynaaminen lämmittely + venyttelyt liikkuvuus-kirjastosta
    const warmup = warmupFor('strength', false);
    warmup.label = 'Calentamiento dinámico';
    warmup.durationMin = 8;
    warmup.note = '5-10 min movimiento ligero antes de estirarse.';
    const exercises = [
      { id: 'cat_cow', label: 'Gato–vaca', sets: '8–12' },
      { id: 'thoracic_opener', label: 'Aperturas torácicas', sets: '6/lado' },
      { id: 'hip_opener', label: 'Aperturas de cadera', sets: '6–8/lado' },
      { id: 'worlds_greatest_stretch', label: "World's greatest stretch", sets: '3–4/lado' },
      { id: 'hip_flexor_stretch', label: 'Estiramiento del flexor de cadera', sets: '30–40 s/lado' },
      { id: 'hamstring_stretch', label: 'Estiramiento de isquiotibiales', sets: '30 s/lado' },
      { id: 'figure4_stretch', label: 'Figure-4 / piriforme', sets: '30–40 s/lado' },
      { id: 'calf_stretch', label: 'Estiramiento de gemelos', sets: '30 s/lado' },
      { id: 'childs_pose', label: 'Postura del niño', sets: '45–60 s' }
    ];
    const s = {
      type: 'mobility',
      subtype: 'lihashuolto',
      name: 'Mantenimiento muscular',
      durationMin: 25,
      details:
        'Movilidad de recuperación ~20–30 min.\n' +
        'Sin entreno duro – calentamiento dinámico + estiramientos.\n' +
        'Respira despacio, no fuerza posiciones extremas.',
      headline: 'Mantenimiento muscular / recuperación (~25 min)',
      exercises: exercises,
      notes: 'Use movimientos de biblioteca de movimiento. Sin dolor.',
      modified: 'tyyppi',
      warmup: warmup,
      mobility: null
    };
    return s;
  }

  function swapSessionType(kind, ctx) {
    ctx = ctx || {};
    const weekIndex = typeof ctx.weekIndex === 'number' ? ctx.weekIndex : 0;
    const phaseId = ctx.phaseId || (ctx.phase && ctx.phase.id) || ctx.phase || 'base';
    const fitness = ctx.fitness || { weekly: 19, longest: 14 };
    const current = ctx.currentSession || null;
    const deload = !!ctx.deload;

    if (kind === 'koti') {
      const tmpl = strengthFor(weekIndex, 'koti');
      return buildStrengthSession(tmpl, 60);
    }
    if (kind === 'sali') {
      const tmpl = strengthFor(weekIndex, 'sali');
      return buildStrengthSession(tmpl, 60);
    }
    if (kind === 'juoksu') {
      // Jos päivä on jo laatujuoksu / pitkä, pidä se (tuore prep); muuten helppo vaiheeseen sopiva
      if (current && current.type === 'run') {
        const quality = current.subtype === 'tempo' || current.subtype === 'intervals' ||
          current.subtype === 'strides' || current.subtype === 'long';
        if (quality) {
          const kept = JSON.parse(JSON.stringify(current));
          kept.modified = 'tyyppi';
          delete kept.painSoftened;
          delete kept.preferCrossTrain;
          attachPrep(kept);
          return kept;
        }
        if (current.subtype === 'easy' || current.subtype === 'easy-short') {
          const kept = JSON.parse(JSON.stringify(current));
          kept.modified = kept.modified || 'tyyppi';
          kept.subtype = 'easy';
          if (!kept.name || /kevennetty|lyhyt|salibandy/i.test(kept.name)) {
            kept.name = 'Conexión fácil';
          }
          attachPrep(kept);
          return kept;
        }
      }
      // Laatupäivän vaihtoehto: jos vaihe build/peak ja ei nykyistä juoksua, silti helppo oletuksena
      return buildEasyRunSession(fitness, deload, phaseId);
    }
    if (kind === 'lihashuolto') {
      return buildLihashuoltoSession();
    }
    if (kind === 'kavely' || kind === 'pyoraily' || kind === 'uinti' ||
        kind === 'salibandy' || kind === 'muu') {
      return buildOtherActivitySession(kind, ctx);
    }
    return current;
  }


  const OTHER_ACTIVITY_KINDS = {
    kavely: {
      name: 'Caminata',
      emoji: '🚶',
      durationMin: 40,
      lightLoad: true,
      details:
        'Caminata – actividad ligera.\n' +
        'No cuenta como carrera dura. Sirve para recuperar, tras el turno o como día suave.\n' +
        'Mantén un ritmo firme; puedes hablar todo el rato.'
    },
    pyoraily: {
      name: 'Bicicleta',
      emoji: '🚴',
      durationMin: 45,
      lightLoad: true,
      details:
        'Bici – ligero / cross-training.\n' +
        'Buena opción cuando correr se siente duro o el dolor molesta.\n' +
        'Mantén la potencia moderada (puedes hablar).'
    },
    uinti: {
      name: 'Natación',
      emoji: '🏊',
      durationMin: 40,
      lightLoad: true,
      details:
        'Nadar - actividad ligera / cruz.' +
        'Un pequeño golpe, bueno para la recuperación. No tire de las apuestas de la piscina duro si cansado.'
    },
    salibandy: {
      name: 'Floorball',
      emoji: '🏒',
      durationMin: 60,
      lightLoad: false,
      hardLoad: true,
      details:
        '🏒 Floorball – día de carga dura (TE hasta 5.0).\n' +
        'Basta como estímulo duro de la semana. No añadas carrera de calidad el mismo día / a la mañana siguiente.\n' +
        'Mark Listo cuando hayas jugado.'
    },
    muu: {
      name: 'Otra actividad',
      emoji: '✨',
      durationMin: 30,
      lightLoad: true,
      details:
        'Otra actividad – marcada como actividad.\n' +
        'Cuenta como actividad semanal ligera (no como carrera dura).'
    }
  };

  /**
   * Caminata / bici / natación / floorball / otro.
   * lightLoad: ei lasketa kovaksi juoksuksi; viikkoaktiivisuuteen kevyesti.
   */
  function buildOtherActivitySession(kind, opts) {
    opts = opts || {};
    const base = OTHER_ACTIVITY_KINDS[kind] || OTHER_ACTIVITY_KINDS.muu;
    const customName = (opts.customName || '').trim();
    const name = kind === 'muu' && customName ? customName : base.name;
    const s = {
      type: 'other',
      subtype: kind === 'muu' ? 'muu' : kind,
      name: name,
      durationMin: opts.durationMin || base.durationMin,
      details: base.details + (kind === 'muu' && customName ? '\nNombre: ' + customName : ''),
      lightLoad: !!base.lightLoad,
      hardLoad: !!base.hardLoad,
      modified: 'tyyppi',
      activityKind: kind
    };
    if (kind === 'salibandy') {
      s.salibandyDay = true;
      s.modified = 'salibandy';
    }
    if (s.lightLoad) {
      s.mobility = mobilityFor('gentle');
    }
    return s;
  }

  function applySick(session) {
    return {
      type: 'rest',
      subtype: 'sick',
      name: 'Enferma – descanso',
      details:
        'Enfermedad: entreno cancelado.\n' +
        'Descansa, hidrátate, escucha al cuerpo.\n' +
        'No sustituyas el entreno automáticamente mañana – vuelve suave cuando estés bien.\n' +
        'Si permite: movimiento de luz opcional debajo (sin entrenamiento).',
      modified: 'sairas',
      originalType: session && session.type,
      mobility: mobilityFor('gentle')
    };
  }

  function applyNoMood(session) {
    if (!session || session.type === 'rest') return session;
    // Tarjoa helpompi: lyhyt TAI lepo
    const short = applyShortSwap(session);
    short.modified = 'ei-fiilista';
    short.name = 'Opción de iluminación';
    short.details =
      'Sin ganas hoy – está bien.\n\n' +
      short.details +
      '\n\nOpción: márcalo como descanso si necesitas recuperar.';
    return short;
  }

  /**
   * 4 viikon ehdotus (suomeksi) – polarizado, floorball = día duro.
   * Alkaa "hoy"-viikosta.
   */
  function fourWeekSuggestion(fitness, settings) {
    const baseW = (fitness && fitness.weekly) || 19;
    const baseL = (fitness && fitness.longest) || 14;
    const longs = [
      round1(clamp(Math.min(baseL * 0.85, 14), 12, 14)),
      round1(clamp(Math.min(baseL * 0.9, 15), 13, 15)),
      round1(clamp(Math.min(baseL, 16), 14, 16)),
      round1(clamp(Math.min(baseL * 0.85, 14), 12, 15)) // kevennys
    ];
    const vols = [
      round1(clamp(baseW, 18, 22)),
      round1(clamp(baseW * 1.05, 19, 24)),
      round1(clamp(baseW * 1.08, 20, 25)),
      round1(clamp(baseW * 0.85, 16, 20)) // deload / kevennys
    ];
    const saliLabel = (function () {
      const d = settings && settings.salibandyDow;
      if (d === null || d === undefined || d === '' || d === 'none') return 'elige noche (p. ej. pe)';
      return DOW_FULL[+d] || 'vi';
    })();

    const weeks = [];
    for (let i = 0; i < 4; i++) {
      weeks.push({
        week: i + 1,
        volumeKm: vols[i],
        longKm: longs[i],
        deload: i === 3,
        summary:
          (i === 3 ? 'Semana de descarga. ' : '') +
          `~${vols[i]} km: 2–3 fáciles, larga ~${longs[i]} km, 1 calidad (tempo/umbral) no en día de floorball, 1–2 fuerza. ` +
          'La mayor parte a ritmo fácil.'
      });
    }

    const textFi =
      'Propuesta de 4 semanas (polarizada, base ~' + baseW + ' km/sem)\n\n' +
      'Esquema semanal:\n' +
      '• 2–3 tiradas fáciles (la mayor parte de los km)\n' +
      '• 1 largo: vk1 ~' + longs[0] + ' → sem3–4 hacia ' + longs[2] + '–' + longs[3] + ' km (regla del ~10 %)\n' +
      '• 1 sesión de calidad (tempo/umbral) – NO en noche de floorball ni a la mañana siguiente\n' +
      '• 1–2 sesiones de fuerza (dominadas 3×3–5 / scap+banda; flexiones 3×10–15; gym RPE 6–7)\n' +
      '• 1 floorball = día duro (TE), deja espacio para ello\n\n' +
      'Noche de floorball en Ajustes: ' + saliLabel + '\n\n' +
      weeks.map(function (w) {
        return 'Sem ' + w.week + (w.deload ? ' (descarga)' : '') +
          ': ~' + w.volumeKm + 'km, largo ~' + w.longKm + ' km';
      }).join('\n');

    return { weeks: weeks, textFi: textFi, salibandyLabel: saliLabel };
  }

  /** Merkitse päivä salibandyksi / kovaksi kuormaksi – kevennä tarvittaessa */
  function applyFloorball(session) {
    if (!session) return session;
    const s = JSON.parse(JSON.stringify(session));
    s.modified = 'salibandy';
    s.salibandyDay = true;
    if (s.type === 'run' && (s.subtype === 'tempo' || s.subtype === 'intervals' || s.subtype === 'strides')) {
      s.subtype = 'easy';
      s.name = 'Fácil (floorball)';
      s.distanceKm = round1(clamp((s.distanceKm || 8) * 0.5, 3, 6));
      s.details =
        '🏒 Floorball / carga dura marcada.\n' +
        'Sesión de calidad omitida – el floorball basta como estímulo duro.\n' +
        'Si corres, máx. ~' + s.distanceKm + ' km muy suave.';
      s.warmup = warmupFor('run', true);
      s.mobility = mobilityFor('run');
    } else if (s.type === 'run') {
      s.name = (s.name || 'Carrera') + '(Día de los Ángeles)';
      if (s.distanceKm) s.distanceKm = round1(s.distanceKm * 0.7);
      s.details =
        '- Flooorball / carga dura.' +
        'Acorta la carrera o sáltala si el partido fue duro.\n' +
        (s.details || '');
    } else if (s.type === 'strength') {
      const short = shortStrength(s);
      Object.assign(s, short);
      s.type = 'strength';
      s.modified = 'salibandy';
      s.name = 'Force Short (Floorball Day)';
      s.details =
        '🏒 Floorball marcado – mantén la fuerza corta o muévela.\n' + (s.details || '');
      s.warmup = warmupFor('strength', true);
      s.mobility = mobilityFor('strength');
    } else if (s.type === 'rest') {
      s.name = 'Floorball / descanso';
      s.subtype = 'salibandy';
      s.details =
        '🏒 Noche de floorball. Márcalo hecho cuando hayas jugado.\n' +
        'Calcular como entrenamiento duro de la semana (TE hasta 5.0). No agregues la calidad mañana por la mañana.';
      s.mobility = mobilityFor('gentle');
    }
    return s;
  }


  const TIP_DISCLAIMER =
    'Esta es una punta de entrenamiento, no un diagnóstico o tratamiento médico. Si el dolor empeora, se inflama o tiene dolor de noche / reposo, busque un juicio profesional.';

  const KNEE_HELP_EXERCISE_IDS = [
    'glute_activation', 'single_leg_hip_thrust', 'quad_stretch',
    'figure4_stretch', 'hip_flexor_stretch', 'calf_raise', 'dead_bug', 'hip_opener'
  ];

  /** Conservative condition tip cards + detect/soften rules (training tips, not diagnosis). */
  const CONDITIONS = {
    runners_knee: {
      id: 'runners_knee',
      label: 'Rodilla del corredor',
      promptTitle: '¿Cómo está la rodilla hoy?',
      promptHint: 'Elige para ajustar el impacto (carrera / fuerza).',
      tipTitle: 'Rodilla del corredor – consejos',
      tipClass: 'knee-tip',
      exerciseIds: KNEE_HELP_EXERCISE_IDS.slice(),
      bullets: [
        'Carga: no subas volumen y bajadas a la vez.',
        'Refuerza cuádriceps y glúteos (control > fuerza máxima).',
        'Evita picos de bajada y saltos bruscos al subir la carga.',
        'Hielo / reposo relativo tras la irritación; vuelve a correr sin dolor de forma gradual.',
        'Pasos cortos, superficie blanda y bici / elíptica son un buen alivio.',
        TIP_DISCLAIMER
      ]
    },
    it_band: {
      id: 'it_band',
      label: 'Banda IT / cadera lateral',
      promptTitle: '¿Cómo está la banda IT / cadera hoy?',
      promptHint: 'La elección ajusta el impacto de la carrera y la carga.',
      tipTitle: 'Banda IT – consejos',
      tipClass: 'condition-tip',
      exerciseIds: [
        'glute_med_side_lie', 'glute_activation', 'single_leg_hip_thrust',
        'figure4_stretch', 'hip_opener', 'quad_stretch', 'calf_stretch'
      ],
      bullets: [
        'Manejo de carga: evitar descenso repentino y picos de volumen.',
        'Fortalece glúteo medio.',
        'Una plataforma más suave y un paso más corto puede aliviar la irritación.',
        'El rollo de espuma / estiramiento puede sentirse bien, pero la gestión de potencia + carga es más importante.',
        'Si la ternura empeora mientras corre, cambia la parte a la rueda / elíptica.',
        TIP_DISCLAIMER
      ]
    },
    rotator_cuff: {
      id: 'rotator_cuff',
      label: 'Manguito rotador / hombro',
      promptTitle: '¿Cómo está el hombro hoy?',
      promptHint: 'La elección ajusta press y la carga del tren superior.',
      tipTitle: 'Manguito rotador / hombro – consejos',
      tipClass: 'condition-tip',
      exerciseIds: [
        'codman_pendulum', 'wall_walk', 'stick_external_rotation', 'iso_external_rotation',
        'band_external_rotation', 'scap_squeeze', 'cross_body_stretch'
      ],
      bullets: [
        'Manejo de carga: evitar fuertes empujes verticales y posiciones superiores dolorosas.',
        'Prioriza rotación externa controlada y apoyo del omóplato (banda ligera).',
        'Mantener el movimiento en un área sin dolor - dolor - progreso.',
        'Correr normalmente está bien si el hombro no está irritado por la agitación de la mano.',
        'Regresar a los impulsos gradualmente cuando los movimientos diarios son indoloros.',
        TIP_DISCLAIMER
      ]
    },
    achilles: {
      id: 'achilles',
      label: 'Aquiles / tendinopatía',
      promptTitle: '¿Cómo está Aquiles hoy?',
      promptHint: 'La elección ajusta el ritmo y el volumen de carrera.',
      tipTitle: 'Aquiles – consejos',
      tipClass: 'condition-tip',
      exerciseIds: [
        'calf_raise_eccentric', 'calf_raise', 'calf_stretch',
        'ankle_mobility', 'towel_stretch_foot', 'hip_opener'
      ],
      bullets: [
        'Manejo de carga: evitar sprint repentino, salto y picos de esquí.',
        'El trabajo de fondo excesivo / lento es a menudo un consejo de entrenamiento útil - progreso con paciencia.',
        'Mantenga el caminar diario / correr dentro de los límites del dolor (el dolor después de la irritación no debe ser largo).',
        'favorecer una plataforma plana; cambiar la rueda si es necesario.',
        'No estirar agresivamente la dolorosa tensión "cortada".',
        TIP_DISCLAIMER
      ]
    },
    plantar_fasciitis: {
      id: 'plantar_fasciitis',
      label: 'Fascitis plantar',
      promptTitle: '¿Cómo está el talón / planta hoy?',
      promptHint: 'La elección ajusta el volumen de carrera y el impacto.',
      tipTitle: 'Fascitis plantar – consejos',
      tipClass: 'condition-tip',
      exerciseIds: [
        'towel_stretch_foot', 'calf_stretch', 'calf_raise',
        'ankle_mobility', 'hip_opener', 'glute_activation'
      ],
      bullets: [
        'Carga: no subas kilómetros de carrera y superficie dura a la vez.',
        'El estiramiento matutino con toalla + gemelos puede aliviar la sensación.',
        'Zapatos resistentes / plataforma más suave; evitar picos descalzos durante la irritación.',
        'Acortar el enlace o cambiar la bicicleta si la ternura empeora.',
        'Fuerza (calf, cadera) + rendimiento gradual.',
        TIP_DISCLAIMER
      ]
    },
    low_back: {
      id: 'low_back',
      label: 'Espalda baja',
      promptTitle: '¿Cómo está la espalda baja hoy?',
      promptHint: 'La elección ajusta el peso muerto y el trabajo exigente.',
      tipTitle: 'Espalda baja – consejos',
      tipClass: 'condition-tip',
      exerciseIds: [
        'dead_bug', 'cat_cow', 'glute_activation', 'plank',
        'hip_flexor_stretch', 'childs_pose', 'hamstring_stretch'
      ],
      bullets: [
        'Manejo de carga: evitar movimientos pesados de rueda y escaños profundos dentro de los límites del dolor.',
        'Prioriza core controlado (dead bug) y movimiento suave (gato–vaca).',
        'Correr: mantener la velocidad fácil; evitar larga cuesta abajo si la ternura aumenta.',
        'Levántate y anda por ahí a veces - sentarse estático largo puede endurecerse.',
        'Radiación afilada, entumecimiento o dolor de noche → juicio profesional.',
        TIP_DISCLAIMER
      ]
    },
    ankle_sprain_acute: {
      id: 'ankle_sprain_acute',
      label: 'Esguince de tobillo (agudo)',
      promptTitle: '¿Cómo está el tobillo hoy?',
      promptHint: 'Esguince agudo: favorece el descanso relativo, sin carga agresiva.',
      tipTitle: 'Esguince de tobillo (agudo) – consejos',
      tipClass: 'condition-tip',
      exerciseIds: [
        'ankle_mobility', 'calf_stretch', 'towel_stretch_foot', 'childs_pose'
      ],
      bullets: [
        'Reposo relativo: evita correr, saltar y pivotes hasta que caminar sea indoloro.',
        'Prioriza bici / tren superior / movimiento suave – sin "probar" de forma agresiva.',
        'Hinchazón, hematoma o miedo a apoyar → da tiempo a sanar; profesional si hace falta.',
        'Cuando caminar está bien, volver gradualmente: caminar → correr → fácil correr.',
        'No empieces con saltos excéntricos o floorball demasiado pronto.',
        TIP_DISCLAIMER
      ]
    },
    ankle_sprain_history: {
      id: 'ankle_sprain_history',
      label: 'Esguince de tobillo (historial)',
      promptTitle: null, // no daily prompt for history-only
      promptHint: null,
      tipTitle: 'Esguince de tobillo (historial) – consejos',
      tipClass: 'condition-tip',
      exerciseIds: [
        'ankle_mobility', 'calf_raise', 'single_leg_hip_thrust',
        'glute_med_side_lie', 'hip_opener', 'calf_stretch'
      ],
      bullets: [
        'Historial: prioriza propiocepción y control a una pierna antes de cambios de dirección duros.',
        'Calienta el tobillo + trabajo ligero de equilibrio.',
        'No pases directo a pliometría agresiva – progresa de forma controlada.',
        'En superficie incierta o con fatiga: más riesgo de recidiva – prioriza la técnica.',
        TIP_DISCLAIMER
      ]
    }
  };

  function painBlob(p) {
    return ((p.area || '') + ' ' + (p.condition || '') + ' ' + (p.notes || '')).toLowerCase();
  }

  function inferConditionId(p) {
    if (!p) return null;
    const blob = painBlob(p);
    const area = (p.area || '').toLowerCase();
    const status = p.status || 'active';

    if (/plantaari|plantar|fasciitti|fasciitis/.test(blob) ||
        (/kantapää|jalkapohja/.test(blob) && /kipu|faski|fasci/.test(blob))) {
      return 'plantar_fasciitis';
    }
    if (/akilles|achilles|aquiles|tendinopat/.test(blob) || area === 'akilles' || area === 'aquiles') {
      return 'achilles';
    }
    if (area === 'nilkka' || area === 'tobillo' || /nyrjähdys|nyrja|sprain|nyrjäht|esguince/.test(blob)) {
      return status === 'history' ? 'ankle_sprain_history' : 'ankle_sprain_acute';
    }
    if (/manguito rotador|kiertajakalvo|kiertäjä|rotator|cuff/.test(blob) || area === 'hombro' || area === 'olkapää') {
      return 'rotator_cuff';
    }
    if (/lumbar|alaselka|alaselkä|low.?back|lumbago|lanneranka/.test(blob) ||
        ((area === 'espalda' || area === 'atrás' || area === 'selkä') && !/yläselkä|upper.?back|niska|kaula|cervical|cuello/.test(blob))) {
      return 'low_back';
    }
    if (/it[- ]?jänne|it[- ]?janne|iliotibia|it.?band|juoksijan.?lonkka|lateraalinen|banda.?it/.test(blob)) {
      return 'it_band';
    }
    if (/juoksijan.?polvi|runners?.?knee|pfps|patellofemor|rodilla.?del.?corredor/.test(blob)) {
      return 'runners_knee';
    }
    if (area === 'polvi' || area === 'rodilla') return 'runners_knee';
    if (area === 'lonkka' || area === 'cadera') return 'it_band';
    if ((area === 'pohje' || area === 'gemelo') && /akilles|aquiles|jänne|tendón/.test(blob)) return 'achilles';
    if (p.condition && CONDITIONS[normalizeConditionKey(p.condition)]) {
      return normalizeConditionKey(p.condition);
    }
    return null;
  }

  function normalizeConditionKey(label) {
    const s = String(label || '').toLowerCase();
    if (/juoksijan.?polvi|runners/.test(s)) return 'runners_knee';
    if (/it|lateraal|iliotibia|juoksijan.?lonkka/.test(s)) return 'it_band';
    if (/kiertäjä|rotator|hombro/.test(s)) return 'rotator_cuff';
    if (/akilles|achilles/.test(s)) return 'achilles';
    if (/plantaari|plantar/.test(s)) return 'plantar_fasciitis';
    if (/lumbar|atrás|espalda|selkä|low.?back/.test(s)) return 'low_back';
    if (/nilkka|tobillo|nyrjähdys|sprain|esguince/.test(s)) {
      return /historia|history/.test(s) ? 'ankle_sprain_history' : 'ankle_sprain_acute';
    }
    return null;
  }

  function detectConditionLabel(area, notes, status) {
    const id = inferConditionId({ area: area || '', notes: notes || '', condition: '', status: status || 'active' });
    return id && CONDITIONS[id] ? CONDITIONS[id].label : '';
  }

  function getActivePains(pains) {
    return (pains || []).filter(function (p) { return p.status === 'active'; });
  }

  function matchedConditions(pains, opts) {
    opts = opts || {};
    const includeHistory = !!opts.includeHistory;
    const seen = {};
    const out = [];
    (pains || []).forEach(function (p) {
      if (!includeHistory && p.status !== 'active') return;
      // History ankle: include even when status is history
      if (p.status === 'history' && includeHistory) {
        const id = inferConditionId(p);
        if (id && !seen[id]) {
          seen[id] = true;
          out.push(CONDITIONS[id]);
        }
        return;
      }
      if (p.status !== 'active') return;
      const id = inferConditionId(p);
      if (id && CONDITIONS[id] && !seen[id]) {
        seen[id] = true;
        out.push(CONDITIONS[id]);
      }
    });
    return out;
  }

  function hasActiveKneePain(pains) {
    return matchedConditions(pains).some(function (c) { return c.id === 'runners_knee'; });
  }

  function hasActiveCondition(pains, id) {
    return matchedConditions(pains).some(function (c) { return c.id === id; });
  }

  function conditionsForTips(pains) {
    // Active conditions + history ankle sprain tips
    const active = matchedConditions(pains);
    const seen = {};
    active.forEach(function (c) { seen[c.id] = true; });
    const out = active.slice();
    (pains || []).forEach(function (p) {
      if (p.status !== 'history') return;
      const id = inferConditionId(Object.assign({}, p, { status: 'history' }));
      if (id === 'ankle_sprain_history' && !seen[id] && CONDITIONS[id]) {
        seen[id] = true;
        out.push(CONDITIONS[id]);
      }
    });
    return out;
  }

  function tipCardHtml(conditionId) {
    const c = CONDITIONS[conditionId];
    if (!c) return null;
    return {
      id: c.id,
      title: c.tipTitle,
      tipClass: c.tipClass || 'condition-tip',
      bullets: c.bullets.slice(),
      exerciseIds: c.exerciseIds.slice()
    };
  }

  function kneeTipCardHtml() {
    return tipCardHtml('runners_knee');
  }

  function allTipCards(pains) {
    return conditionsForTips(pains).map(function (c) { return tipCardHtml(c.id); }).filter(Boolean);
  }

  function conditionsNeedingPrompt(pains) {
    return matchedConditions(pains).filter(function (c) { return c.promptTitle; });
  }

  /**
   * Normalize today's answers.
   * Legacy: kneeAnswer string 'ok'|'aristaa'|'kipea'
   * New: map { conditionId: answer } or health.conditionCheck[iso]
   */
  function normalizeAnswers(answers, pains) {
    if (answers == null) return {};
    if (typeof answers === 'string') {
      const map = {};
      if (hasActiveKneePain(pains) || answers) map.runners_knee = answers;
      return map;
    }
    return answers || {};
  }

  function worstAnswer(map) {
    const vals = Object.keys(map || {}).map(function (k) { return map[k]; });
    if (vals.indexOf('kipea') >= 0) return 'kipea';
    if (vals.indexOf('aristaa') >= 0) return 'aristaa';
    if (vals.length && vals.every(function (v) { return v === 'ok'; })) return 'ok';
    return null;
  }

  /**
   * Soften session when active pain conditions or today's checks say aristaa/kipeä.
   * answers: 'ok'|'aristaa'|'kipea' (legacy knee) | { conditionId: answer }
   */
  function applyPainSoftening(session, pains, answers) {
    if (!session) return session;
    const ansMap = normalizeAnswers(answers, pains);
    const activeConds = matchedConditions(pains);

    // If user said OK for all prompted conditions that are active, skip
    if (activeConds.length) {
      const prompted = activeConds.filter(function (c) { return c.promptTitle; });
      if (prompted.length && prompted.every(function (c) { return ansMap[c.id] === 'ok'; })) {
        return session;
      }
    }

    // Legacy: single 'ok' with only knee
    if (answers === 'ok') return session;

    const needsSoft = activeConds.some(function (c) {
      const a = ansMap[c.id];
      if (a === 'ok') return false;
      if (a === 'aristaa' || a === 'kipea') return true;
      // no answer yet → soften for active (conservative), except history-only tips
      return c.id !== 'ankle_sprain_history';
    });
    // Also soften if legacy knee answer without map
    if (!needsSoft && !(answers === 'aristaa' || answers === 'kipea')) return session;
    if (!activeConds.length && !(answers === 'aristaa' || answers === 'kipea')) return session;

    const s = JSON.parse(JSON.stringify(session));
    const ids = activeConds.map(function (c) { return c.id; });
    if (!ids.length && (answers === 'aristaa' || answers === 'kipea')) ids.push('runners_knee');

    const severe = activeConds.some(function (c) {
      const a = ansMap[c.id];
      if (a === 'kipea') return true;
      return (pains || []).some(function (p) {
        if (p.status !== 'active') return false;
        if (inferConditionId(p) !== c.id) return false;
        return p.severity === 'mod' || p.severity === 'kova';
      });
    }) || answers === 'kipea' || ids.indexOf('ankle_sprain_acute') >= 0;

    const hasKnee = ids.indexOf('runners_knee') >= 0 || ids.indexOf('it_band') >= 0;
    const hasAchilles = ids.indexOf('achilles') >= 0 || ids.indexOf('plantar_fasciitis') >= 0;
    const hasAnkleAcute = ids.indexOf('ankle_sprain_acute') >= 0;
    const hasShoulder = ids.indexOf('rotator_cuff') >= 0;
    const hasBack = ids.indexOf('low_back') >= 0;

    if (s.type === 'run') {
      s.painSoftened = true;
      s.modified = (s.modified ? s.modified + '+' : '') + 'kipu';
      if (hasAnkleAcute || (severe && (hasKnee || hasAchilles))) {
        s.name = (s.name || 'Carrera') + '→ rueda / cruz (dolor)';
        s.preferCrossTrain = true;
        s.details =
          (hasAnkleAcute
            ? 'TOBILLO (ESGUINCE AGUDO) – reposo relativo\nPrioriza bici / tren superior. Sin carrera, saltos ni cambios de dirección.\n'
            : 'EL DOLOR MOLESTA MUCHO\nHoy prioriza bici, elíptica o caminata enérgica.\n') +
          'Evita bajadas, saltos y cambios de dirección bruscos.\n' +
          (s.details || '');
        if (s.distanceKm) s.distanceKm = round1(s.distanceKm * (hasAnkleAcute ? 0.4 : 0.55));
        if (s.subtype === 'tempo' || s.subtype === 'intervals' || s.subtype === 'strides') {
          s.subtype = 'easy';
        }
      } else {
        const tag = hasAchilles ? 'Aquiles/planta' : hasKnee ? 'rodilla/IT' : hasBack ? 'espalda' : 'dolor';
        s.name = (s.name || 'Carrera') + ' (' + tag + ' tenido en cuenta)';
        s.details =
          'DOLOR TENIDO EN CUENTA – impacto suavizado\n' +
          'Mantén ritmo fácil, evita bajadas y picos de velocidad, acorta si hace falta.\n' +
          'Puedes cambiar parte por bici / elíptica.\n' +
          (s.details || '');
        if (s.distanceKm) s.distanceKm = round1(s.distanceKm * 0.8);
        if (s.subtype === 'tempo' || s.subtype === 'intervals') {
          s.subtype = 'easy';
          s.name = 'Fácil (' + tag + ' tenido en cuenta)';
        }
      }
      s.warmup = warmupFor('run', true);
    } else if (s.type === 'strength') {
      s.painSoftened = true;
      s.modified = (s.modified ? s.modified + '+' : '') + 'kipu';
      if (s.exercises && s.exercises.length) {
        s.exercises = s.exercises.map(function (ex) {
          const id = ((ex.id || '') + ' ' + (ex.label || '')).toLowerCase();
          let next = ex;
          if (hasKnee || hasAnkleAcute) {
            if (/lunge|squat|jump|box|askel|kyykky/.test(id)) {
              next = Object.assign({}, next, {
                sets: severe || hasAnkleAcute ? '2×6–8 suave / o saltar' : '2–3×8 controlado, ROM sin dolor',
                alt: next.alt || 'puente de glúteos / glute bridge',
                painNote: hasAnkleAcute ? 'Tobillo: evita saltos y superficies inestables' : 'Rodilla / IT: mantén el movimiento sin dolor'
              });
            }
          }
          if (hasAchilles) {
            if (/jump|box|calf|pohje|hop/.test(id)) {
              next = Object.assign({}, next, {
                sets: '2×8–10 controlado / o omitir',
                painNote: 'Aquiles / planta: sin pliometría durante la irritación'
              });
            }
          }
          if (hasShoulder) {
            if (/press|punnerr|overhead|pysty|bench|hombro|military|dip/.test(id)) {
              next = Object.assign({}, next, {
                sets: severe ? 'suave / o omitir' : '2–3×8–12 suave, ROM sin dolor',
                alt: next.alt || 'rotación externa con banda / remo',
                painNote: 'Hombro: evita la posición overhead dolorosa'
              });
            }
          }
          if (hasBack) {
            if (/deadlift|maastaveto|squat|kyykky|good.?morning|rdl/.test(id)) {
              next = Object.assign({}, next, {
                sets: severe ? 'suave / o omitir' : '2–3×6–8 suave, espalda neutra',
                alt: next.alt || 'hip thrust / glute bridge / dead bug',
                painNote: 'Espalda baja: mantén neutra; para si irradia'
              });
            }
          }
          return next;
        });
      }
      s.durationMin = Math.round((s.durationMin || 60) * (severe ? 0.7 : 0.85));
      s.name = (s.name || 'Fuerza') + ' (dolor tenido en cuenta)';
      const notes = [];
      if (hasKnee) notes.push('RODILLA / IT: evita saltos y sentadillas profundas dentro del dolor. Prioriza cierre de cadena / fuerza de cadera.');
      if (hasAnkleAcute) notes.push('TOBILLO (agudo): sin saltos, superficies inestables ni cambios de dirección.');
      if (hasAchilles) notes.push('AQUILES / PLANTA: sin pliometría; trabajo bajo control.');
      if (hasShoulder) notes.push('HOMBRO: evita empujes verticales fuertes; prioriza rotación externa y soporte del hombro.');
      if (hasBack) notes.push('ESPALDA: aligera peso muerto / sentadillas; prioriza dead bug / glúteos.');
      s.notes = notes.join(' ') + ' ' + (s.notes || '');
      s.details = formatStrengthDetails(s);
      s.warmup = warmupFor('strength', true);
    }
    return s;
  }


  /** Floorballn jälkeinen palautuspäivä – vahvistettu */
  function applyFloorballRecovery(session) {
    if (!session) return session;
    const s = JSON.parse(JSON.stringify(session));
    s.modified = 'salibandy-recovery';
    s.salibandyRecovery = true;
    if (s.type === 'run') {
      const hard = s.subtype === 'tempo' || s.subtype === 'intervals' ||
        s.subtype === 'strides' || s.subtype === 'long';
      s.subtype = 'easy';
      s.name = hard ? 'Pago (después de la pensión)' : 'Easy / Return (alibandy +)';
      const base = s.distanceKm || 8;
      s.distanceKm = round1(clamp(base * (hard ? 0.55 : 0.75), 3, 7));
      s.details =
        '• El floorball de ayer fue una carga dura (TE hasta 5.0).\n' +
        'Hoy sólo regreso fácil ~' + s.distanceKm + ' km o caminata.\n' +
        'Sin tempo, intervalos ni tirada larga. Calidad como pronto pasado mañana.\n' +
        'Si sus pies son pesados: cambiar al mantenimiento muscular o caminar.';
      s.cueIds = ['easy_run_form'];
      s.warmup = warmupFor('run', true);
      s.mobility = mobilityFor('run');
    } else if (s.type === 'strength') {
      const short = shortStrength(s);
      Object.assign(s, short);
      s.type = 'strength';
      s.name = 'Fuerza de luz (retorno de libanesas)';
      s.durationMin = 25;
      s.details =
        '🏒 Día de recuperación tras el floorball.\n' +
        'Mantén la fuerza corta y ligera (RPE ≤6) o cámbiala por movilidad.\n' +
        (s.details || '');
      s.warmup = warmupFor('strength', true);
      s.mobility = mobilityFor('strength');
    } else if (s.type === 'rest' || s.type === 'mobility') {
      s.name = 'Recuperación tras el floorball';
      s.details =
        '🏒 Bien – descanso/recuperación tras el floorball.\n' +
        'Ligero caminar + movimiento ok. No hay carga extra.';
      s.mobility = mobilityFor('gentle');
    }
    return s;
  }


  // ---------- Entrenadorn suunnitelma (coach-plan.json) ----------
  const COACH_TYPES = ['juoksu', 'koti', 'sali', 'lihashuolto', 'kavely', 'lepo'];
  const COACH_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function coachStr(v, max) {
    return typeof v === 'string' ? v.slice(0, max || 4000) : '';
  }

  /** Validoi ja siistii coach-plan-objektin. Palauttaa null jos ei kelpaa. */
  // --- Hombro (manguito rotador) kuntoutustila ---

  /** Päivittäinen ~10 min liikerata-/kuntoutusrutiini (kivuton alue). */
  const SHOULDER_REHAB_DAILY = [
    { id: 'codman_pendulum', label: 'Péndulos Codman', sets: '2×30–60 s / dirección' },
    { id: 'wall_walk', label: 'Caminata de dedos por la pared', sets: '2×10' },
    { id: 'stick_flexion', label: 'Flexión con palo', sets: '2×10–15' },
    { id: 'stick_external_rotation', label: 'Rotación externa pasiva con palo', sets: '2×10–15' },
    { id: 'scap_squeeze', label: 'Apretón de omóplatos', sets: '2×15' },
    { id: 'iso_external_rotation', label: 'Rotación externa asimétrica', sets: '2×10 × 5 s (~30 %)' },
    { id: 'iso_internal_rotation', label: 'Rotación interna isométrica', sets: '2×10 × 5 s (~30 %)' },
    { id: 'cross_body_stretch', label: 'Estréguese sobre el pecho', sets: '2×30 s' }
  ];

  /** Fuerzapäivien loppuun lisättävä kevyt vahvistava hombroblokki. */
  const SHOULDER_REHAB_STRENGTH = [
    { id: 'codman_pendulum', label: 'Péndulos Codman', sets: '60 s' },
    { id: 'band_external_rotation', label: 'Rotación externa con banda (ligera)', sets: '2–3×12–15' },
    { id: 'band_internal_rotation', label: 'Rotación interna con banda (ligera)', sets: '2–3×12–15' },
    { id: 'side_lying_external_rotation', label: 'Rotación externa de lado (0–1 kg)', sets: '2–3×10–15' },
    { id: 'band_row_low', label: 'Remo ligero con banda (bajo)', sets: '2–3×12–15' },
    { id: 'wall_circles', label: 'Bola contra pared - spinning', sets: '2×10 / dirección' }
  ];

  const SHOULDER_SAFE_POOLS = {
    sali: [
      { id: 'leg_press', label: 'Prensa de piernas', sets: '3×8–10 · RPE 6–7' },
      { id: 'sl_rdl_bw', label: 'RDL a una pierna sin peso', sets: '3×8/pierna' },
      { id: 'step_up_bw', label: 'Step-up sin peso', sets: '3×10/pierna' },
      { id: 'reverse_crunch', label: 'Crunch inverso', sets: '3×10–12' },
      { id: 'dead_bug', label: 'Insecto muerto - sólo pies, manos a lado', sets: '3×8/lado' },
      { id: 'calf_raise', label: 'Elevación de gemelos', sets: '3×12' }
    ],
    koti: [
      { id: 'wall_sit', label: 'Sentadilla isométrica en pared', sets: '3×30–60 s' },
      { id: 'lunge', label: 'Zancada sin peso', sets: '3×10/pierna' },
      { id: 'sl_rdl_bw', label: 'RDL a una pierna sin peso', sets: '3×8/pierna' },
      { id: 'single_leg_hip_thrust', label: 'Compra de cadera de una pierna (manos casuales)', sets: '3×10/pierna' },
      { id: 'reverse_crunch', label: 'Crunch inverso', sets: '3×10–12' },
      { id: 'dead_bug', label: 'Insecto muerto - sólo pies, manos a lado', sets: '3×8/lado' },
      { id: 'step_up_bw', label: 'Step-up sin peso', sets: '3×10/pierna' },
      { id: 'calf_raise', label: 'Elevación de gemelos en step', sets: '3×15' }
    ],
    mobility: [
      { id: 'hip_flexor_stretch', label: 'Estiramiento del flexor de cadera', sets: '2×30 s/lado' },
      { id: 'hamstring_stretch', label: 'Estiramiento de isquiotibiales', sets: '2×30 s/lado' },
      { id: 'figure4_stretch', label: 'Figure-4 / piriformis', sets: '2×30 s/lado' },
      { id: 'quad_stretch', label: 'Estiramiento de cuádriceps', sets: '2×30 s/lado' },
      { id: 'calf_stretch', label: 'Estiramiento de gemelos', sets: '2×30 s/lado' },
      { id: 'cross_body_stretch', label: 'Estiramiento cruzado al pecho (suave)', sets: '2×30 s' }
    ],
    warmup: [
      { id: 'codman_pendulum', label: 'Péndulos Codman', sets: '30 s / dirección' },
      { id: 'scap_squeeze', label: 'Apretón de omóplatos', sets: '10' },
      { id: 'leg_swings', label: 'Balanceos de pierna', sets: '10/lado' },
      { id: 'bw_squat_warmup', label: 'Sentadilla con peso corporal', sets: '10' }
    ]
  };

  const SHOULDER_NOTE =
    'Modo hombro (manguito rotador): ejercicios que cargan el hombro sustituidos por trabajo de piernas / core.';
  const SHOULDER_COACH_NOTE =
    'Espacio de hombro: excluye chin-ups, push-ups, todos push-ups / movimientos verticales, remo con peso, bolas de cara, rueda de ab' +
    'y placas / costillas con las manos. Hacer un asiento de pared, escapo de paso y un paso hacia arriba sin pesos, compra de una cadera de pie y error muerto (sólo pies).';

  function shoulderLoader(lib) {
    lib = lib || (global && global.TreeniExercises) || null;
    return function (id) {
      if (!id) return false;
      if (lib && typeof lib.loadsShoulder === 'function') return lib.loadsShoulder(id);
      const e = lib && lib.getExercise ? lib.getExercise(id) : null;
      return !!(e && e.loadsShoulder);
    };
  }

  function filterShoulderList(list, loads, pool, minLen) {
    const src = Array.isArray(list) ? list : [];
    const kept = [];
    let removed = 0;
    src.forEach(function (ex) {
      if (!ex || loads(ex.id)) { removed++; return; }
      const e = Object.assign({}, ex);
      if (e.altId && loads(e.altId)) { delete e.altId; delete e.alt; }
      // Käsiin otettava kuorma (mancuernas / kahvakuula) carga el hombro → ilman painoja
      if (/mancuerna|kahvakuula|kettlebell/i.test(e.label || '')) {
        e.label = String(e.label).replace(/\s*\([^)]*(mancuerna|kahvakuula|kettlebell)[^)]*\)/gi, '')
          .replace(/\s*(mancuernailla|kahvakuulalla)/gi, '').trim() + ' (sin peso)';
      }
      kept.push(e);
    });
    const target = Math.max(src.length, minLen || 0);
    if (removed && pool) {
      const have = {};
      kept.forEach(function (e) { have[e.id] = true; });
      for (let i = 0; i < pool.length && kept.length < target; i++) {
        if (!have[pool[i].id]) { kept.push(Object.assign({ shoulderSwap: true }, pool[i])); have[pool[i].id] = true; }
      }
    }
    return { list: kept, removed: removed };
  }

  /**
   * Rehab de hombrotila: poistaa el hombro kuormittavat liikkeet (exercises.js loadsShoulder),
   * korvaa jalka-/keskivartaloliikkeillä ja lisää kevyen kuntoutusblokin voima-/liikkuvuuspäiviin.
   * Idempotentti – voidaan ajaa uudelleen samalle sessiolle.
   */
  function applyShoulderRehab(session, lib) {
    if (!session) return session;
    const loads = shoulderLoader(lib);
    let s = JSON.parse(JSON.stringify(session));

    // Uinti carga el hombro → kävely
    if (s.type === 'other' && (s.subtype === 'uinti' || s.activityKind === 'uinti')) {
      const walk = buildOtherActivitySession('kavely');
      walk.name = 'Caminando (en lugar de nadar - hombro)';
      walk.details = 'Nadar carga el hombro – hoy caminata o bici suave.\n' + walk.details;
      s = walk;
    }

    let changed = false;
    if (s.warmup && Array.isArray(s.warmup.exercises)) {
      const r = filterShoulderList(s.warmup.exercises, loads, null, 0);
      if (r.removed) {
        const add = SHOULDER_SAFE_POOLS.warmup.filter(function (p) {
          return !r.list.some(function (e) { return e.id === p.id; });
        }).slice(0, Math.max(2, r.removed));
        s.warmup.exercises = add.map(function (x) { return Object.assign({}, x); }).concat(r.list);
        changed = true;
      }
    }
    if (s.mobility && Array.isArray(s.mobility.exercises)) {
      const r = filterShoulderList(s.mobility.exercises, loads, SHOULDER_SAFE_POOLS.mobility, 0);
      if (r.removed) { s.mobility.exercises = r.list; changed = true; }
      if (!s.mobility.exercises.length) s.mobility = null;
    }

    const isStrength = s.type === 'strength';
    const isMobility = s.type === 'mobility';
    if ((isStrength || isMobility) && Array.isArray(s.exercises) && s.exercises.length) {
      const pool = isMobility ? SHOULDER_SAFE_POOLS.mobility
        : (s.location === 'koti' ? SHOULDER_SAFE_POOLS.koti : SHOULDER_SAFE_POOLS.sali);
      const r = filterShoulderList(s.exercises, loads, pool, isStrength ? 4 : 0);
      if (r.removed) { s.exercises = r.list; changed = true; }
    }

    if (isStrength || isMobility) {
      s.rehabBlock = {
        id: 'shoulder_rehab',
        label: 'Rehabilitación del hombro (rotador derecho)',
        durationMin: 10,
        note: 'Carga ligera, 2-3 × 10- 15. Hazlo en un área indolorosa. Si el dolor aumenta, haga el péndulo y la trayectoria.',
        exercises: (isStrength ? SHOULDER_REHAB_STRENGTH : SHOULDER_REHAB_DAILY).map(function (x) { return Object.assign({}, x); })
      };
      if (s.coach && !(s.exercises && s.exercises.length)) {
        s.shoulderNote = SHOULDER_COACH_NOTE;
      }
    }

    if (changed) {
      if (isStrength && s.exercises && s.exercises.length) {
        s.notes = SHOULDER_NOTE; // alkuperäiset punnerrus-/leuanvetovinkit eivät päde modo hombro
        if (s.equipmentNote) s.equipmentNote = s.location === 'koti'
          ? 'Equipo: tabla de paso, pared, banda elástica ligera (rehabilitación).'
          : 'Equipo: frenos de pierna, tabla de paso, banda elástica ligera (rehabilitación).';
        s.details = formatStrengthDetails(s);
      } else if (isMobility && s.exercises) {
        s.details = (s.headline || s.name || 'Movilidad') + '\n' +
          s.exercises.map(function (e) { return '• ' + (e.label || e.id) + (e.sets ? ' – ' + e.sets : ''); }).join('\n');
      }
    }
    s.shoulderRehab = true;
    return s;
  }

  /** coach-plan.json flags → { shoulderRehab: true|false } (vain tunnetut boolean-liput). */
  function parseCoachFlags(raw) {
    const out = {};
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      if (typeof raw.shoulderRehab === 'boolean') out.shoulderRehab = raw.shoulderRehab;
    }
    return out;
  }


  function parseCoachPlan(obj) {
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch (e) { return null; }
    }
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.days)) return null;
    const days = [];
    const seen = {};
    obj.days.forEach(function (d) {
      if (!d || typeof d !== 'object' || !COACH_DATE_RE.test(String(d.date || ''))) return;
      const type = COACH_TYPES.indexOf(d.type) >= 0 ? d.type : 'juoksu';
      const day = {
        date: d.date,
        type: type,
        title: coachStr(d.title, 120) || 'Entreno del entrenador',
        details: coachStr(d.details),
        note: coachStr(d.note, 600),
        warmup: coachStr(d.warmup, 600),
        cooldown: coachStr(d.cooldown, 600),
        distanceKm: typeof d.distanceKm === 'number' && d.distanceKm > 0 && d.distanceKm < 60 ? d.distanceKm : null,
        durationMin: typeof d.durationMin === 'number' && d.durationMin > 0 && d.durationMin < 400 ? d.durationMin : null,
        subtype: coachStr(d.subtype, 30),
        options: (Array.isArray(d.options) ? d.options : []).slice(0, 6).map(function (o) {
          return {
            label: coachStr(o && o.label, 60) || 'Alternativa',
            details: coachStr(o && o.details),
            distanceKm: o && typeof o.distanceKm === 'number' && o.distanceKm > 0 && o.distanceKm < 60 ? o.distanceKm : null
          };
        })
      };
      seen[day.date] = day; // viimeinen voittaa
    });
    Object.keys(seen).sort().forEach(function (k) { days.push(seen[k]); });
    return {
      version: typeof obj.version === 'number' ? obj.version : 0,
      updatedAt: coachStr(obj.updatedAt, 40),
      flags: parseCoachFlags(obj.flags),
      feedback: parseCoachFeedback(obj.feedback),
      done: parseCoachDone(obj.done),
      days: days
    };
  }

  /** PT:n palaute: { 'YYYY-MM-DD': { title, text } } → sama muoto, siivottuna (max 60). */
  function parseCoachFeedback(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    Object.keys(raw).filter(function (k) { return COACH_DATE_RE.test(k); }).sort().slice(-60).forEach(function (k) {
      const v = raw[k];
      const fb = typeof v === 'string' ? { title: '', text: v } : (v && typeof v === 'object' ? v : null);
      if (!fb) return;
      const text = coachStr(fb.text, 1500);
      if (!text) return;
      out[k] = { title: coachStr(fb.title, 80), text: text };
    });
    return out;
  }

  const DONE_TYPES = ['run', 'walk', 'strength', 'floorball', 'cycle', 'swim', 'mobility', 'other'];
  const DONE_LABELS = { run: 'Carrera', walk: 'Caminata', strength: 'Fuerza', floorball: 'Floorball',
    cycle: 'Bici', swim: 'Natación', mobility: 'Movilidad', other: 'Actividad' };

  /** Tehdyt treenit (Garmin/käsin): { 'YYYY-MM-DD': [{type, km, min, pace, source, id}] } – vain treenidata. */
  function parseCoachDone(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    Object.keys(raw).filter(function (k) { return COACH_DATE_RE.test(k); }).sort().slice(-90).forEach(function (k) {
      const list = Array.isArray(raw[k]) ? raw[k] : [];
      const items = [];
      list.slice(0, 10).forEach(function (e) {
        if (!e || typeof e !== 'object') return;
        const type = DONE_TYPES.indexOf(e.type) >= 0 ? e.type : 'other';
        const id = typeof e.id === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(e.id) ? e.id : null;
        if (!id) return;
        const km = typeof e.km === 'number' && e.km > 0 && e.km < 200 ? Math.round(e.km * 100) / 100 : null;
        const min = typeof e.min === 'number' && e.min > 0 && e.min < 1000 ? Math.round(e.min) : null;
        const pace = typeof e.pace === 'string' && /^\d{1,2}:\d{2}$/.test(e.pace) ? e.pace : null;
        items.push({ type: type, km: km, min: min, pace: pace, source: e.source === 'garmin' ? 'garmin' : 'manual', id: id });
      });
      if (items.length) out[k] = items;
    });
    return out;
  }

  function doneLabel(type) { return DONE_LABELS[type] || DONE_LABELS.other; }

  /** Session → tehdyn treenin tyyppi (run|walk|strength|floorball|mobility|…) tai null (lepo). */
  function sessionKind(session, status) {
    const s = session;
    if (status === 'salibandy' || (s && (s.salibandyDay || s.subtype === 'salibandy' || s.modified === 'salibandy'))) return 'floorball';
    if (!s) return null;
    // Opción del entrenador "Solo caminar" en día de carrera → caminata, no carrera
    if ((s.type === 'run' || s.type === 'race') && s.coach && WALK_RE.test(s.coach.selected || '')) return 'walk';
    if (s.type === 'run' || s.type === 'race') return 'run';
    if (s.type === 'strength') return 'strength';
    if (s.type === 'mobility') return 'mobility';
    if (s.type === 'other') {
      if (s.subtype === 'kavely' || WALK_RE.test(s.name || '')) return 'walk';
      if (s.subtype === 'pyoraily') return 'cycle';
      if (s.subtype === 'uinti') return 'swim';
      return 'other';
    }
    return null;
  }

  /**
   * Caminata (no cuenta como km de carrera). Ojo: "caminar-trotar" ES carrera (run-walk),
   * solo "Solo caminar", "caminata", "paseo", "kävely"/"walk" son caminata.
   */
  const WALK_RE = /k[äa]vely|\bwalk|solo\s+caminar|caminata|paseo|caminar(?!\s*[-–\/y]\s*trot)(?!\s+y\s+trot)/i;

  /** Lokimerkintä → tyyppi (vanhoissa merkinnöissä ei ole kind-kenttää). */
  function logKind(l) {
    if (!l) return null;
    // Día de carrera marcado hecho con la opción "Solo caminar" (entradas antiguas: kind 'run') → caminata
    if (!l.garminId && WALK_RE.test(l.coach || '')) return 'walk';
    if (l.kind) return l.kind;
    if (/salibandy|säbä/i.test(l.name || '')) return 'floorball';
    if (l.type === 'run' || l.type === 'race') return 'run';
    if (l.type === 'strength') return 'strength';
    if (l.type === 'mobility') return 'mobility';
    if (WALK_RE.test(l.name || '')) return 'walk';
    return l.type === 'rest' ? null : 'other';
  }

  /** Uusin palaute päiville [fromIso..toIso]; null jos ei. */
  function latestCoachFeedback(plan, fromIso, toIso) {
    const fb = plan && plan.feedback;
    if (!fb) return null;
    const keys = Object.keys(fb).filter(function (k) { return k >= fromIso && k <= toIso; }).sort();
    if (!keys.length) return null;
    const k = keys[keys.length - 1];
    return Object.assign({ date: k }, fb[k]);
  }

  /** Lyhyt sisältöavain: muuttuu kun valmentaja muuttaa päivän sisältöä. */
  function coachKey(day) {
    const str = JSON.stringify(day || {});
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return (day && day.date || '') + ':' + h.toString(36);
  }

  function findCoachDay(plan, iso) {
    if (!plan || !Array.isArray(plan.days)) return null;
    for (let i = 0; i < plan.days.length; i++) if (plan.days[i].date === iso) return plan.days[i];
    return null;
  }

  /** Muuntaa valmentajan päivän sovelluksen sessio-objektiksi. */
  function coachDayToSession(day, meta) {
    if (!day) return null;
    let base;
    switch (day.type) {
      case 'koti': base = { type: 'strength', location: 'koti', subtype: day.subtype || 'coach', exercises: [] }; break;
      case 'sali': base = { type: 'strength', location: 'sali', subtype: day.subtype || 'coach', exercises: [] }; break;
      case 'lihashuolto': base = { type: 'mobility', subtype: 'lihashuolto', exercises: [] }; break;
      case 'kavely': base = { type: 'other', subtype: 'kavely', lightLoad: true }; break;
      case 'lepo': base = { type: 'rest', subtype: 'rest' }; break;
      default: base = { type: 'run', subtype: day.subtype || 'easy' };
    }
    const s = Object.assign(base, {
      name: day.title,
      details: day.details || '',
      coach: {
        key: coachKey(day),
        date: day.date,
        note: day.note || '',
        warmup: day.warmup || '',
        cooldown: day.cooldown || '',
        options: (day.options || []).map(function (o) { return Object.assign({}, o); }),
        updatedAt: (meta && meta.updatedAt) || '',
        version: (meta && meta.version) || 0
      }
    });
    if (day.distanceKm) s.distanceKm = day.distanceKm;
    if (day.durationMin) s.durationMin = day.durationMin;
    return s;
  }

  /** Valitsee valmentajan vaihtoehdon (esim. Kevennetty) sessioksi. */
  function applyCoachOption(session, idx) {
    if (!session || !session.coach) return null;
    const opt = (session.coach.options || [])[idx];
    if (!opt) return null;
    const s = JSON.parse(JSON.stringify(session));
    s.name = (s.name || '').replace(/ – .*$/, '') + ' – ' + opt.label;
    s.details = opt.details || s.details;
    if (opt.distanceKm) s.distanceKm = opt.distanceKm;
    // Opción "Solo caminar" en día de carrera: sin km de carrera (caminar ≠ correr)
    if ((s.type === 'run' || s.type === 'race') && WALK_RE.test(opt.label || '')) {
      s.type = 'other'; s.subtype = 'kavely'; s.lightLoad = true;
      s.distanceKm = opt.distanceKm || null;
    }
    s.modified = /kevenn/i.test(opt.label) ? 'keventa' : /kovenn/i.test(opt.label) ? 'koventa' : 'coach-option';
    s.coach.selected = opt.label;
    return s;
  }

  function coachOptionIndex(session, re) {
    if (!session || !session.coach) return -1;
    const opts = session.coach.options || [];
    for (let i = 0; i < opts.length; i++) if (re.test(opts[i].label)) return i;
    return -1;
  }

  global.TreeniPlan = {
    parseCoachPlan,
    parseCoachFeedback,
    latestCoachFeedback,
    parseCoachDone,
    sessionKind,
    logKind,
    doneLabel,
    coachKey,
    findCoachDay,
    coachDayToSession,
    applyCoachOption,
    coachOptionIndex,
    COACH_TYPES,
    PHASES,
    DOW_FI,
    DOW_FULL,
    STRENGTH,
    WARMUP_TEMPLATES,
    MOBILITY_TEMPLATES,
    toISO,
    parseISO,
    addDays,
    daysBetween,
    startOfWeek,
    generatePlan,
    getDayFromPlan,
    getPhase,
    fitnessBaseline,
    applyKeventa,
    applyKoventa,
    applyShortSwap,
    swapLocation,
    noGymSession,
    swapSessionType,
    buildLihashuoltoSession,
    buildEasyRunSession,
    applySick,
    applyNoMood,
    shortStrength,
    formatStrengthDetails,
    warmupFor,
    mobilityFor,
    attachPrep,
    STRENGTH_RAW,
    fourWeekSuggestion,
    applyFloorball,
    applyPainSoftening,
    hasActiveKneePain,
    hasActiveCondition,
    getActivePains,
    KNEE_HELP_EXERCISE_IDS,
    CONDITIONS,
    kneeTipCardHtml,
    tipCardHtml,
    allTipCards,
    conditionsForTips,
    conditionsNeedingPrompt,
    inferConditionId,
    detectConditionLabel,
    matchedConditions,
    normalizeAnswers,
    TIP_DISCLAIMER,
    buildOtherActivitySession,
    OTHER_ACTIVITY_KINDS,
    applyFloorballRecovery,
    applyShoulderRehab,
    parseCoachFlags,
    SHOULDER_REHAB_DAILY,
    SHOULDER_REHAB_STRENGTH
  };
})(typeof window !== 'undefined' ? window : global);
