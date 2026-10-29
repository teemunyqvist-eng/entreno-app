/**
 * Biblioteca de ejercicios – técnica, beneficios, errores, vídeos
 * Videot: youtube-nocookie embed kun ID varmistettu; muuten ulkoinen linkki.
 */
(function (global) {
  'use strict';

  function ytEmbed(id) {
    return 'https://www.youtube-nocookie.com/embed/' + id;
  }
  function ytWatch(id) {
    return 'https://www.youtube.com/watch?v=' + id;
  }
  function ytSearch(q) {
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  }

  /** @type {Record<string, object>} */
  const EXERCISES = {
    // ---- Voima: sali ----
    back_squat: {
      id: 'back_squat',
      loadsShoulder: true,
      name: 'Sentadilla trasera',
      category: 'voima',
      equipment: ['barra', 'rack'],
      benefits: [
        'Desarrolla la fuerza de piernas y core',
        'Mejora la economía de carrera y la fuerza en cuestas/final',
        'Apoya el control de la cadera y la rodilla en el estrés'
      ],
      cues: [
        'Barra sobre trapecios (high-bar) o un poco más abajo',
        'Pecho arriba, core firme',
        'Mango a pie, peso a pie',
        'Profundidad al menos de muslos paralelos si la movilidad lo permite',
        'Sube con control; no rebotes desde abajo'
      ],
      mistakes: [
        'Las rodillas se hunden hacia dentro',
        'La espalda se redondea o los talones se levantan',
        'Bajada demasiado rápida sin control'
      ],
      video: { type: 'embed', youtubeId: 'bEv6CCg2BC8', label: 'Jeff Nippard – squat technique' }
    },
    front_squat: {
      id: 'front_squat',
      loadsShoulder: true,
      name: 'Sentadilla frontal',
      category: 'voima',
      equipment: ['barra', 'rack'],
      benefits: [
        'Destaca los muslos delanteros y la posición más vertical',
        'Reforzar el cuerpo medio con la carga delantera',
        'Buena alternativa a la sentadilla trasera en fuerza de corredora'
      ],
      cues: [
        'Barley en los hombros delanteros, codos altos',
        'El pecho y los codos en todo el movimiento',
        'Ponte las rodillas delante de ti. Tan alto como puedas.',
        'Profundidad mínima para paralelo'
      ],
      mistakes: [
        'Los codos caen → bar goteo',
        'Liiallinen etukumara',
        'Los talones están subiendo'
      ],
      video: { type: 'link', url: ytSearch('Jeff Nippard how to front squat'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    goblet_squat: {
      id: 'goblet_squat',
      loadsShoulder: true,
      name: 'Sentadilla goblet',
      category: 'voima',
      equipment: ['mancuerna', 'pesa rusa'],
      benefits: [
        'Fácil de aprender, segura en casa/gimnasio',
        'Aprende a picar la batería antes de la barra pesada',
        'Activa piernas y core con carga ligera'
      ],
      cues: [
        'Peso frente al pecho, codos entre los muslos',
        'Pies a la anchura de hombros, puntas ligeramente hacia fuera',
        'Siéntate atrás-abajo, pecho erguido',
        'Peso corporal a pie'
      ],
      mistakes: [
        'Peso cae hacia delante y hacia atrás redondeado',
        'Las rodillas entran.',
        'Posición demasiado estrecha'
      ],
      video: { type: 'link', url: ytSearch('goblet squat form tutorial'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    band_squat: {
      id: 'band_squat',
      loadsShoulder: true,
      name: 'Sentadilla con banda',
      category: 'voima',
      equipment: ['banda elástica'],
      benefits: [
        'La resistencia crece hacia arriba - buena opción casera',
        'Preserva la carga de squat sin pesos',
        'Activa glúteos con banda a resistencia lateral'
      ],
      cues: [
        'Soporte en cinta, mangos a la altura del hombro o detrás del cuello',
        'El mismo patrón de sentadilla que el goblet',
        'Mantenga la tensión en la cinta todo el tiempo',
        'Tempo controlado, sobre todo al subir'
      ],
      mistakes: [
        'La cinta se deslizará bajo tus pies.',
        'Las rodillas entran.',
        'Corto rango'
      ],
      video: { type: 'link', url: ytSearch('band squat form resistance band'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    deadlift: {
      id: 'deadlift',
      loadsShoulder: true,
      name: 'Peso muerto',
      category: 'voima',
      equipment: ['barra'],
      benefits: [
        'Fortalecer la cadena trasera (botones, muslos traseros, espalda)',
        'Moving to running power output and posture',
        'Construir la potencia máxima general'
      ],
      cues: [
        'Puño en la pierna media, piernas contra la barra',
        'Mantener → rodillas en la barra → pecho arriba, espalda neutral',
        'Tire la barra hacia arriba pierna / muslo',
        'Cierra las caderas sin exagerar',
        'Controla la misma ruta'
      ],
      mistakes: [
        'Redondeado en ascensor',
        'Quita el cuerpo (demasiado lejos)',
        'Atrás sin trabajo de pie'
      ],
      video: { type: 'embed', youtubeId: 'p2OPUi4xGrM', label: 'Starting Strength – deadlift' }
    },
    rdl: {
      id: 'rdl',
      loadsShoulder: true,
      name: 'Peso muerto rumano',
      category: 'voima',
      equipment: ['barra'],
      benefits: [
        'Meta en los muslos y nalgas',
        'Caminata de cadera en el teach - corredor crítico',
        'Fortalecer el control isométrico de la espalda baja'
      ],
      cues: [
        'Ángulo de rodilla leve, empuja tus caderas hacia atrás',
        'No puedo creerlo.',
        'Atrás neutral, pecho abierto',
        'Calcular hasta el muslo trasero (normalmente bajo la rodilla)',
        'Levántate de la cadera, no te muevas de la espalda.'
      ],
      mistakes: [
        'Las rodillas se flexionan demasiado (se convierte en sentadilla)',
        'Redondeo atrás',
        'La barra se aleja del cuerpo'
      ],
      video: { type: 'embed', youtubeId: '_oyxCn2iSjU', label: 'Jeff Nippard - RDL' }
    },
    rdl_db: {
      id: 'rdl_db',
      loadsShoulder: true,
      name: 'Peso muerto rumano (mancuernas)',
      category: 'voima',
      equipment: ['mancuernas', 'banda elástica'],
      benefits: [
        'Mismo bisagra de cadera en casa con pesos ligeros',
        'Buena activación de la cadena posterior antes de correr',
        'Al frenar el tempo, la carga es suficiente para ≤ 10 kg de peso'
      ],
      cues: [
        'Peso frente a los muslos, ligero ángulo de rodilla',
        'Cadera trasera, neutral',
        'Vuelo Tempro (P.J. 3 s bajando)',
        'Siente el estiramiento en los muslos traseros antes de levantarse'
      ],
      mistakes: [
        'Regreso',
        'Pesos lejos del cuerpo',
        'Poco tempo sin emoción'
      ],
      video: { type: 'embed', youtubeId: '_oyxCn2iSjU', label: 'Jeff Nippard - RDL (aplicado por tontos)' }
    },
    bench_press: {
      id: 'bench_press',
      loadsShoulder: true,
      name: 'Press de banca',
      category: 'voima',
      equipment: ['barra', 'mancuernas', 'banco'],
      benefits: [
        'La fuerza del pecho, hombros y camillas',
        'Propulsión del cuerpo superior (apoyo de funcionamiento)',
        'Movimientos de rueda equilibrados'
      ],
      cues: [
        'Atrás y abajo, pies firmemente en el suelo',
        'Extracción más ancha que los hombros, muñecas rectas',
        'Calcular la barra en la parte inferior / media del pecho de una manera controlada',
        'Codos aproximadamente 45-70 ° del cuerpo',
        'Empuje un poco curvado hacia los racks'
      ],
      mistakes: [
        'Codos 90 ° a lados (carga de hombro)',
        'Quítate los traseros del asiento.',
        'Rebote en el pecho'
      ],
      video: { type: 'embed', youtubeId: 'vcBig73ojpE', label: 'Jeff Nippard – bench press' }
    },
    incline_bench: {
      id: 'incline_bench',
      loadsShoulder: true,
      name: 'Press inclinado',
      category: 'voima',
      equipment: ['barra', 'mancuernas', 'banco'],
      benefits: [
        'Destaca el hierro superior y los hombros',
        'Vaihtelu tasaiseen penkkiin',
        'Buen desarrollo del empuje'
      ],
      cues: [
        'Banco a 15–45°',
        'El mismo soporte de hombro y pie que el asiento',
        'Bajo en el pecho superior',
        'Tempo controlado, bloqueo completo arriba'
      ],
      mistakes: [
        'Ángulo demasiado empinado → se convierte en push-up vertical',
        'Los codos demasiado anchos',
        'Corto rango'
      ],
      video: { type: 'link', url: ytSearch('incline bench press form Jeff Nippard'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    cable_chest_press: {
      id: 'cable_chest_press',
      loadsShoulder: true,
      name: 'Press con cable',
      category: 'voima',
      equipment: ['polea'],
      benefits: [
        'Resistencia uniforme en todo el rango',
        'Una alternativa más amigable con el hombro al banco',
        'Buen empuje en polea'
      ],
      cues: [
        'Agarres a altura del pecho, da un paso adelante',
        'Empuje hacia adelante, codos ligeramente enganchados en la cerradura',
        'Control de bofetadas, sin caída delantera.',
        'Restore Control'
      ],
      mistakes: [
        'Demasiado velocidad y oscilaciones',
        'Hombros suben hacia las orejas',
        'Back hoof sin soporte'
      ],
      video: { type: 'link', url: ytSearch('cable chest press form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    floor_press: {
      id: 'floor_press',
      loadsShoulder: true,
      name: 'Press de suelo',
      category: 'voima',
      equipment: ['mancuernas', 'step'],
      benefits: [
        'Empuje seguro en casa sin banco',
        'La trayectoria limitada salva los hombros',
        'Vale con ≤10 kg + tempo lento'
      ],
      cues: [
        'Acuéstese en el suelo / paso, pesos sobre el pecho',
        'Bajo hasta que los brazos superiores toquen el suelo',
        'Rompe un momento → Empujar',
        'hombro trasero, muñecas rectas'
      ],
      mistakes: [
        'Los codos demasiado anchos',
        'Rebote desde el suelo',
        'Ranteet taittuvat'
      ],
      video: { type: 'link', url: ytSearch('dumbbell floor press form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    band_press: {
      id: 'band_press',
      loadsShoulder: true,
      name: 'Press con banda',
      category: 'voima',
      equipment: ['banda elástica'],
      benefits: [
        'Trabajo en casa sin pesos',
        'La resistencia aumenta al final',
        'Buena alternativa amable con el hombro'
      ],
      cues: [
        'Tape detrás o anclado',
        'Empujar hacia adelante desde la altura del pecho',
        'Reembolso controlado',
        'Mantenga su cuerpo medio apretado'
      ],
      mistakes: [
        'Tape demasiado flojo / demasiado apretado',
        'Hombros hacia adelante',
        'Solo rango parcial'
      ],
      video: { type: 'link', url: ytSearch('resistance band chest press form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    overhead_press: {
      id: 'overhead_press',
      loadsShoulder: true,
      name: 'Press militar',
      category: 'voima',
      equipment: ['mancuernas', 'banda elástica', 'barra'],
      benefits: [
        'El poder de los hombros y camillas',
        'Soporte vertical torso en posición de ejecución',
        'Tensión total del cuerpo (core)'
      ],
      cues: [
        'Peso a la altura del hombro, codos ligeramente hacia adelante',
        'Aprietes y abdomen',
        'Empuje recto, la cabeza detrás si es necesario',
        'Controla tus hombros'
      ],
      mistakes: [
        'Excesivo hollín en la espalda inferior',
        'Peso demasiado adelante',
        'Locking parcial'
      ],
      video: { type: 'link', url: ytSearch('dumbbell overhead press form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    lat_pulldown: {
      id: 'lat_pulldown',
      loadsShoulder: true,
      name: 'Jalón al pecho',
      category: 'voima',
      equipment: ['polea', 'polea'],
      benefits: [
        'La fuerza de la espalda ancha y la tira superior',
        'Quiero decir, quiero decir, quiero decir, quiero decir, a tener la intención de',
        'Apoya la postura en ejecución'
      ],
      cues: [
        'Extraer ligeramente más ancho que los hombros',
        'Tire el pecho, codos hacia abajo y hacia atrás',
        'Acelera, no te alejes demasiado.',
        'Subida controlada'
      ],
      mistakes: [
        'Balanceo del torso',
        'Jalón detrás del cuello',
        'Una trayectoria demasiado corta'
      ],
      video: { type: 'link', url: ytSearch('lat pulldown proper form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    seated_cable_row: {
      id: 'seated_cable_row',
      loadsShoulder: true,
      name: 'Remo sentado / polea baja',
      category: 'voima',
      equipment: ['polea'],
      benefits: [
        'El poder del juguete medio y el Latsi',
        'Mejorar la postura y el control del hombro',
        'Contrapeso al press de banca / flexiones'
      ],
      cues: [
        'Siéntate estable, pecho abierto',
        'Tira el mango en el ombligo, los codos atrás',
        'Junta las escápulas al final',
        'No balancees con tu cuerpo'
      ],
      mistakes: [
        'Tirador trasero redondo',
        'Demasiado movimiento péndulo.',
        'Hombros se elevan'
      ],
      video: { type: 'link', url: ytSearch('seated cable row form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    bent_over_row: {
      id: 'bent_over_row',
      loadsShoulder: true,
      name: 'Remo inclinado',
      category: 'voima',
      equipment: ['barra', 'mancuernas'],
      benefits: [
        'Tira fuerte de la espalda con pesos libres',
        'Construir la fuerza trasera superior para la posición de funcionamiento',
        'Buena tensión de todo el cuerpo'
      ],
      cues: [
        'Caderas atrás, torso ~45°',
        'Tire la barra / pesas en el abdomen inferior',
        'Codos cerca de las costillas',
        'Atrás neutral todo el tiempo'
      ],
      mistakes: [
        'Redondeado',
        'Tire demasiado alto en el pecho',
        'Momentum twitch'
      ],
      video: { type: 'link', url: ytSearch('barbell bent over row form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    pullup: {
      id: 'pullup',
      loadsShoulder: true,
      name: 'Dominada',
      category: 'voima',
      equipment: ['barra de dominadas'],
      benefits: [
        'Fuerza corporal superior y media',
        'Mejorar la postura y el anillo de hombro',
        'Ejercicio eficaz con peso corporal en casa'
      ],
      cues: [
        'Extender ancho del hombro, activar primero las almohadillas del hombro',
        'Tire el pecho hacia el poste',
        'Codos abajo, no sólo en sus brazos.',
        'Compute control a manos casi rectas'
      ],
      mistakes: [
        'Golpear y remar sin control',
        'Repeticiones a medias',
        'Hombros en las orejas sin activar escápulas'
      ],
      video: { type: 'link', url: ytSearch('how to do a pull up Athlean-X'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    push_up: {
      id: 'push_up',
      loadsShoulder: true,
      name: 'Flexión',
      category: 'voima',
      equipment: ['peso corporal'],
      benefits: [
        'Propulsión corporal superior sin equipo',
        'Cintura escapular y core juntos',
        'Fácil progresar en repeticiones (baseline ~30–35)'
      ],
      cues: [
        'Las manos un poco más anchas que los hombros, el pecho hacia el suelo.',
        'Cuerpo recto de la cabeza a los talones',
        'Codos ~ 45 ° del cuerpo, sin ancho a los lados',
        'Rango completo: pecho casi al piso → acceso directo'
      ],
      mistakes: [
        'Caderas con o sin correas',
        'Repeticiones a medias',
        'Hombros en las orejas / cuello tenso'
      ],
      video: { type: 'link', url: ytSearch('perfect push up form tutorial'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    scap_pull: {
      id: 'scap_pull',
      loadsShoulder: true,

      name: 'Scapular pull (omóplatos)',
      category: 'voima',
      equipment: ['barra de dominadas'],
      benefits: [
        'Aprende cómo activar el hombro antes de chin-ups',
        'Reforzado por el anillo de hombro',
        'Buen inicio si aún no puedes hacer dominadas'
      ],
      cues: [
        'Aguanta las manos rectas',
        'Tire las cuchillas hacia abajo y juntos sin codos',
        'Mantener 1-2 s →',
        'Pecho abierto, cuello relajado'
      ],
      mistakes: [
        'La inclinación del codo (vuelva a la tira de la barbilla)',
        'Balanceo',
        'Los hombros se quedan en las orejas'
      ],
      video: { type: 'link', url: ytSearch('scapular pull up tutorial'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    band_assisted_pullup: {
      id: 'band_assisted_pullup',
      loadsShoulder: true,
      name: 'Dominada asistida con banda',
      category: 'voima',
      equipment: ['barra de dominadas', 'banda elástica'],
      benefits: [
        'Permite el movimiento completo antes de su chin-up',
        'Construye tracción de forma progresiva',
        'Mantiene el modelo de negocio adecuado'
      ],
      cues: [
        'Tapa para poste, rodilla / pie para enlace',
        'La misma técnica que en dominadas',
        'Controlar la factura - no caer a la cinta',
        'Reducir la subvención con el tiempo'
      ],
      mistakes: [
        'La cinta demasiado gruesa → no desarrollo',
        'Balanceo',
        'Repeticiones parciales'
      ],
      video: { type: 'link', url: ytSearch('band assisted pull up form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    band_row: {
      id: 'band_row',
      loadsShoulder: true,
      name: 'Remo con banda',
      category: 'voima',
      equipment: ['banda elástica'],
      benefits: [
        'Jalón en casa sin polea',
        'Mejorar la postura y la fuerza superior de la espalda',
        'Fácil ajustar la resistencia'
      ],
      cues: [
        'Cinta de anclaje (puerta / poste) a altura del pecho',
        'Devuélvete los codos.',
        'Pecho abierto, torso quieto',
        'Retorno lento'
      ],
      mistakes: [
        'Balanceo del torso',
        'Hombros se elevan',
        'Demasiado corto una apuesta'
      ],
      video: { type: 'link', url: ytSearch('resistance band row form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    inverted_row: {
      id: 'inverted_row',
      loadsShoulder: true,
      name: 'Remo invertido',
      category: 'voima',
      equipment: ['barra de dominadas', 'barra'],
      benefits: [
        'Kehonpainoveto vaakatasossa',
        'Buen puente hacia la dominada',
        'Reforzar la espalda superior y el núcleo'
      ],
      cues: [
        'Bajo el poste, la línea recta corporal',
        'Tire el pecho en la barra',
        'Extiende las cuchillas, cuenta de manera controlada',
        'Facilita flexionando las piernas / dificulta estirándolas'
      ],
      mistakes: [
        'La pelvis cae (no hay línea recta)',
        'Solo levanta el cuello',
        'Barra demasiado alta → demasiado fácil'
      ],
      video: { type: 'link', url: ytSearch('inverted row form tutorial'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    plank: {
      id: 'plank',
      loadsShoulder: true,
      name: 'Plancha',
      category: 'voima',
      equipment: [],
      benefits: [
        'Resistencia corporal media y postura',
        'Se traslada al control del tronco al correr',
        'Simple, sin herramientas'
      ],
      cues: [
        'Codos debajo de los hombros',
        'Cuerpo vivo: tobillos de la cabeza',
        'Aprieta el estómago y las nalgas. No te dobles.',
        'Respira con calma, prioriza la calidad del tiempo'
      ],
      mistakes: [
        'La pelvis cae o se eleva demasiado',
        'La cabeza está colgando',
        'Aguanta hasta que la forma colapse.'
      ],
      video: { type: 'embed', youtubeId: 'xVrALzPc7dM', label: 'ATHLEAN-X – plank progression' }
    },
    ab_wheel: {
      id: 'ab_wheel',
      loadsShoulder: true,
      name: 'Rueda abdominal',
      category: 'voima',
      equipment: ['rueda abdominal'],
      benefits: [
        'Vahva anteriorinen core (anti-extension)',
        'Mejora la estabilidad del cuerpo',
        'Progresivo: de rodillas → de puntillas'
      ],
      cues: [
        'Empieza de rodillas si lo necesitas',
        'Ponte delante de ti de una manera controlada.',
        'Mantenga el estómago apretado todo el tiempo.',
        'Volver con el mismo control'
      ],
      mistakes: [
        'La zona lumbar se arquea (peligroso)',
        'Demasiado largo rollo demasiado pronto',
        'Contener la respiración por pánico'
      ],
      video: { type: 'link', url: ytSearch('ab Rueda forma Athlean-X'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    dead_bug: {
      id: 'dead_bug',
      name: 'Dead bug',
      category: 'voima',
      equipment: [],
      benefits: [
        'Cada núcleo sin carga',
        'Mejorar la cooperación entre miembros y organismos',
        'Buena alternativa/complemento a la plancha'
      ],
      cues: [
        'Bodytaste, baja luz trasera en el suelo',
        'La mano opuesta + la pierna controla',
        'No dejes caer tu espalda.',
        'Exhala al extender'
      ],
      mistakes: [
        'La zona lumbar se arquea',
        'Demasiado rápido.',
        'Mantener la respiración'
      ],
      video: { type: 'link', url: ytSearch('dead bug exercise form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    ball_rollout: {
      id: 'ball_rollout',
      loadsShoulder: true,
      name: 'Rueda con pelota',
      category: 'voima',
      equipment: ['pelota de ejercicio'],
      benefits: [
        'Anti-extensión similar a la rueda abdominal',
        'Control del core',
        'Alternativa a la rueda abdominal en el gym'
      ],
      cues: [
        'Codos o manos en la bola',
        'Avance hacia adelante de una manera controlada, pelvis estable',
        'Regresar con Control',
        'Mantén tu cuello neutral.'
      ],
      mistakes: [
        'La pelvis está cayendo.',
        'Demasiado largo.',
        'Hombros suben hacia las orejas'
      ],
      video: { type: 'link', url: ytSearch('stability ball rollout form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    lunge: {
      id: 'lunge',
      name: 'Zancada',
      category: 'voima',
      equipment: ['mancuernas', 'step'],
      benefits: [
        'Una fuerza de pierna y equilibrio',
        'Corrige asimetrías al correr',
        'Fortalecer las nalgas y los muslos delanteros'
      ],
      cues: [
        'Paso atrás o al step, rodilla delantera ~sobre el tobillo',
        'Máster erecto, muslo delantero y muslo trasero ~ 90 °',
        'Empuja hacia adelante',
        'Hacer ambos lados'
      ],
      mistakes: [
        'La rodilla delantera se hunde hacia dentro',
        'Demasiado corto un paso',
        'Eteentaipuminen'
      ],
      video: { type: 'link', url: ytSearch('dumbbell reverse lunge form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    single_leg_hip_thrust: {
      id: 'single_leg_hip_thrust',
      name: 'Puente glúteos a una pierna',
      category: 'voima',
      equipment: ['step'],
      benefits: [
        'La fuerza de la nalga para el corredor',
        'Mejorar la estabilidad pélvica',
        'Reducir las debilidades típicas del corredor'
      ],
      cues: [
        'Paso de atrás superior, un pie hacia abajo',
        'Pon tu cadera arriba con tus nalgas',
        'Mantenga 1 pt arriba, cuente bajo control',
        'Pelvis recta, sin inclinación'
      ],
      mistakes: [
        'Empujar hacia atrás inferior en lugar de nalgada',
        'Inclinación lateral de la pelvis',
        'Una trayectoria demasiado corta'
      ],
      video: { type: 'link', url: ytSearch('single leg hip thrust form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    calf_raise: {
      id: 'calf_raise',
      name: 'Elevación de gemelos',
      category: 'voima',
      equipment: ['step'],
      benefits: [
        'Fuerza de la pierna y resistencia al tendón',
        'Supports running effort phase',
        'Ayuda a la resistencia del Aquiles/gemelo'
      ],
      cues: [
        '♪ Patos en el grifo, eres libre de llevar ♪',
        'Muy bien, vamos.',
        'Disminuir el control para estirar',
        'Mantén tus rodillas suaves, no cerradas'
      ],
      mistakes: [
        'Salto sin movimiento completo',
        'Demasiado rápido.',
        'Sólo fase parcial / baja'
      ],
      video: { type: 'link', url: ytSearch('standing calf raise form step'), label: 'Ver vídeo (búsqueda YouTube)' }
    },

    // ---- Calentamiento / movilidad / estiramientos ----
    light_jog: {
      id: 'light_jog',
      name: 'Trote suave / marcha',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Aumenta la temperatura corporal y la frecuencia cardíaca de forma segura',
        'Preparar articulaciones y músculos para correr o fuerza',
        'Reduce la rigidez al comienzo del entrenamiento'
      ],
      cues: [
        'Tempo fácil - respiración calma',
        '2–5 min suelen bastar',
        'Inicio / rodilla ascensor ok interior',
        'Hombros relajados, no tensar el cuello'
      ],
      mistakes: [
        'Empieza muy rápido.',
        'Saltos explosivos antes de calentar',
        'Skip completely cold'
      ],
      video: { type: 'link', url: ytSearch('easy jog warm up routine'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    leg_swings: {
      id: 'leg_swings',
      name: 'Balanceos de pierna',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Abre la cadera de forma dinámica para correr',
        'Activa flexores de cadera y cadena posterior',
        'Mejora la sensación de longitud del paso sin estiramiento estático'
      ],
      cues: [
        'Confirmar a pared / poste si es necesario',
        'Mueve el pie de una y otra vez.',
        'Mantenga las caderas estables - no oscilar a lado',
        '10–12 balanceos por lado; luego laterales'
      ],
      mistakes: [
        'Demasiado grande un swing sin control',
        '♪ Alrededor del cuerpo ♪',
        'con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con con'
      ],
      video: { type: 'link', url: ytSearch('leg swings dynamic warm up running'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    hip_opener: {
      id: 'hip_opener',
      name: 'Aperturas de cadera',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Más movimiento de cadera para correr y squat',
        'Reducir la rigidez en el área pélvica',
        'Preparar nalgas y rizos de cadera'
      ],
      cues: [
        'Stand o cuadrado: cadera abierta de manera controlada',
        'P. ej. sentada 90/90 o círculos de rodilla',
        'Respira con calma, no fuerces el extremo del rango',
        '8–10 repeticiones por lado'
      ],
      mistakes: [
        'Que vaya al dolor.',
        'Redondo la espalda inferior vigorosamente',
        'Mantenga la respiración'
      ],
      video: { type: 'link', url: ytSearch('hip openers warm up mobility'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    worlds_greatest_stretch: {
      id: 'worlds_greatest_stretch',
      loadsShoulder: true,
      name: "World's greatest stretch",
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Combina la apertura de cadera, pecho y cadena',
        'Excelente calentamiento general para carrera y fuerza',
        'Mejorar la rotación'
      ],
      cues: [
        'Da un paso adelante a zancada profunda, rodilla trasera baja',
        'La misma mano en el suelo junto a los muslos interiores',
        'Redondea tu mano libre hacia el techo, tus ojos seguirán',
        'Cambia de lado; 3–5 por lado'
      ],
      mistakes: [
        'La rodilla delantera cae hacia dentro',
        'La rotación solo desde hombros, no desde la columna torácica',
        'Tempo demasiado rápido sin control'
      ],
      video: { type: 'link', url: ytSearch("world's greatest stretch mobility"), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    ankle_mobility: {
      id: 'ankle_mobility',
      name: 'Movilidad de tobillo',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Calienta la piel y corre el tobillo dorsiflexion',
        'Reduce la compensación en las rodillas y las caderas',
        'Soportes de contacto paso'
      ],
      cues: [
        'Mango a pared sobre los dedos (estilo de prueba de pared)',
        'El talón se queda en el suelo.',
        'También hacer círculos de tobillo en ambas direcciones',
        '8–10 por lado'
      ],
      mistakes: [
        'El talón se levanta de la pared',
        'Knee entra.',
        'Presión excesiva'
      ],
      video: { type: 'link', url: ytSearch('ankle mobility dorsiflexion drill'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    thoracic_opener: {
      id: 'thoracic_opener',
      loadsShoulder: true,
      name: 'Aperturas torácicas',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Abre rotación y extensión de la espalda alta',
        'Mejorar la posición de funcionamiento y el movimiento de los impulsos',
        'Reduce la sensación del hombro "conectado"'
      ],
      cues: [
        'Cuatro vías o lado: girar el brazo abierto',
        'Exhala al abrir',
        'Mantenga las caderas firmes - el movimiento viene del pecho',
        '6–8 por lado'
      ],
      mistakes: [
        'Va por ahí con su cadera.',
        'Forzar detrás del cuello',
        'Demasiado rápido para onda'
      ],
      video: { type: 'link', url: ytSearch('thoracic spine mobility opener open book'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    arm_circles: {
      id: 'arm_circles',
      loadsShoulder: true,
      name: 'Círculos de brazos',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Hombros cálidos y entrenamiento de fuerza superior del cuerpo',
        'Más sensación de movimiento de articulación del hombro',
        'Activación rápida sin equipo'
      ],
      cues: [
        'Círculos grandes y pequeños en ambas direcciones',
        'Baja los hombros, no te metes en los oídos.',
        '10–15 / suunta',
        'Se puede conectar a una banda ligera de botellas'
      ],
      mistakes: [
        'Los hombros suben y se tensan',
        'Demasiado rápido para onda sin control',
        'Dolor en el hombro - reducir el movimiento'
      ],
      video: { type: 'link', url: ytSearch('arm circles warm up shoulders'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    bw_squat_warmup: {
      id: 'bw_squat_warmup',
      name: 'Sentadilla con peso corporal (calentamiento)',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Activa el patrón de sentadilla antes de cargar',
        'Calenta tus piernas y caderas',
        'Compruebe la movilidad antes del gimnasio / energía casera'
      ],
      cues: [
        'Más rápido, peso en todas las piernas',
        '8–12 repeticiones controladas',
        'Syvyys oman liikkuvuuden mukaan',
        'Sin peso: solo activación'
      ],
      mistakes: [
        'Las rodillas entran.',
        'Los talones están subiendo',
        'Se está precipitando en un polo pesado sin esto.'
      ],
      video: { type: 'link', url: ytSearch('bodyweight squat warm up form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    glute_activation: {
      id: 'glute_activation',
      name: 'Activación de glúteos',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Despierta los glúteos antes de correr o de fuerza',
        'Ayuda al control de la cadera',
        'Reducir la compensación de espalda más baja'
      ],
      cues: [
        'Compra de caderas en la parte posterior o almeja',
        'Aprieta tus nalgas hasta 1-2 pts',
        '10–12 repeticiones',
        'Sentirse en las nalgas - no en la parte inferior de la espalda'
      ],
      mistakes: [
        'Empujar hacia abajo',
        'Demasiado rápido.',
        'No siente los glúteos en absoluto'
      ],
      video: { type: 'link', url: ytSearch('glute activation bridge warm up'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    cat_cow: {
      id: 'cat_cow',
      loadsShoulder: true,
      name: 'Gato–vaca',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Movimiento de espalda suave y relajación del sistema nervioso',
        'Bueno para movilidad en día de descanso/enfermedad',
        'Prepara el esternón y la pelvis'
      ],
      cues: [
        'Plaza: Rotar redondeando y hollín',
        'Respira al ritmo del movimiento',
        '8–12 repeticiones lentas',
        'Quédate en un área indolorosa.'
      ],
      mistakes: [
        'Demasiado rápido para onda',
        'Posiciones extremas de la fuerza',
        'Estrangular el cuello'
      ],
      video: { type: 'link', url: ytSearch('cat cow stretch mobility'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    calf_stretch: {
      id: 'calf_stretch',
      name: 'Longitud superficial',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Devuelve los becerros después de correr',
        'Ayuda a la flexibilidad de Aquiles/tobillo',
        'Ayuda a reducir la rigidez al día siguiente'
      ],
      cues: [
        'Contra la pared: pie trasero recto (gastroc) y rodilla enganchada (soleus)',
        'Mantener 20-30 pts / posición / lado',
        'Tacón abajo, cadera hacia adelante',
        'Respira con calma – sin rebotes'
      ],
      mistakes: [
        'Bouncing "stretching"',
        'El talón se levanta',
        'Se extiende mucho antes de correr'
      ],
      video: { type: 'link', url: ytSearch('calf stretch wall gastroc soleus'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    hip_flexor_stretch: {
      id: 'hip_flexor_stretch',
      name: 'Estiramiento del flexor de cadera',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Libera los flexores de cadera tensos por sentarte y correr',
        'Apoya la posición pélvica y la posición de funcionamiento',
        'Buen enfriamiento tras la tirada larga'
      ],
      cues: [
        'Polviseisominen: takapolvi maassa, etujalka 90°',
        'Empuja la pelvis suavemente hacia adelante, torso hacia arriba',
        '20–40 s por lado',
        'Puedes levantar la misma mano para estirar extra'
      ],
      mistakes: [
        'Enciende la espalda baja vigorosamente',
        'La rodilla delantera va demasiado lejos.',
        'Mantenga la respiración'
      ],
      video: { type: 'link', url: ytSearch('hip flexor stretch kneeling'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    hamstring_stretch: {
      id: 'hamstring_stretch',
      name: 'Stretch',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Reducir la rigidez de la cadena trasera después de correr',
        'Soporta la sensación de bisagra de cadera',
        'Ayuda a la recuperación'
      ],
      cues: [
        'De pie o cara con correa / toalla',
        'Mantenga la espalda neutral - no girar vigorosamente',
        '20–30 s por lado',
        'Tensión de luz ok, dolor no'
      ],
      mistakes: [
        'Redondea tu espalda',
        'Tetas para estirar',
        'Estréguese demasiado agresivamente inmediatamente después del entrenamiento'
      ],
      video: { type: 'link', url: ytSearch('hamstring stretch lying strap'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    quad_stretch: {
      id: 'quad_stretch',
      name: 'Stretching of the front',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Abre cuádriceps y flexor de cadera',
        'Bueno tras carrera y fuerza centrada en sentadilla',
        'Soporta la sensación de rodilla'
      ],
      cues: [
        'De pie: tire el talón hacia el glúteo',
        'Manchas lado a lado, caderas suavemente hacia atrás',
        '20–30 s por lado',
        'Confirmar a la pared para el equilibrio'
      ],
      mistakes: [
        'Mi espalda es demasiado.',
        'rodilla a un lado',
        'Tire demasiado duro'
      ],
      video: { type: 'link', url: ytSearch('standing quad stretch form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    figure4_stretch: {
      id: 'figure4_stretch',
      name: 'Figura 4 / estiramiento de piriformo',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Abre glúteo y rotadores externos profundos de la cadera',
        'Alivia el “glúteo tenso” después de correr',
        'Buen enfriamiento opcional'
      ],
      cues: [
        'Sobre la base: tobillo sobre la rodilla opuesta',
        'Tire el muslo suavemente hacia el pecho',
        '20–40 s por lado',
        'Mantén tus caderas planas'
      ],
      mistakes: [
        'Twist la rodilla al lado dolorosamente',
        'Levantándose la cabeza y girando el cuello',
        'Stretch demasiado corto un tiempo repetidamente twitch'
      ],
      video: { type: 'link', url: ytSearch('figure 4 piriformis stretch'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    childs_pose: {
      id: 'childs_pose',
      loadsShoulder: true,
      name: 'Lapsen asento',
      category: 'liikkuvuus',
      equipment: [],
      benefits: [
        'Relajar el sistema nervioso en reposo / día enfermo',
        'Apertura suave de la espalda y la cadera',
        'Buen cierre para movilidad suave'
      ],
      cues: [
        'Siéntate sobre los talones, brazos delante, frente al suelo',
        'Respira profundo hacia los laterales',
        '30–60 s',
        'Aplique las rodillas dependiendo de la comodidad'
      ],
      mistakes: [
        'Haz que tus rodillas estén lastimadas',
        'Mantenga la respiración',
        'Estoy nervioso por mis hombros.'
      ],
      video: { type: 'link', url: ytSearch("child's pose stretch yoga"), label: 'Ver vídeo (búsqueda YouTube)' }
    },

    // ---- Juoksu ----
    easy_run_form: {
      id: 'easy_run_form',
      name: 'Postura de carrera fácil',
      category: 'juoksu',
      equipment: [],
      benefits: [
        'Construye base aeróbica para el maratón',
        'Permite alta kilometraje semanal',
        'Devoluciones entre ejercicios más duros'
      ],
      cues: [
        'Respiración tranquila: puedes hablar',
        'Paso corto, ligero; no sobrecarga',
        'Hombros relajados, brazos ~90°',
        'Ojos hacia adelante, pies suavemente rectos'
      ],
      mistakes: [
        'Ritmo demasiado fuerte para “fácil”',
        'hombros y puños rígidos',
        'Un largo paso con un tacón.'
      ],
      video: { type: 'link', url: ytSearch('easy run form cues midfoot'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    long_run_cues: {
      id: 'long_run_cues',
      name: 'Tirada larga – consejos',
      category: 'juoksu',
      equipment: [],
      benefits: [
        'Maratonadaptación clave (durabilidad, metabolismo de grasa)',
        'Entrena hidratación y nutrición',
        'Construir sostenibilidad espiritual'
      ],
      cues: [
        'Empieza con calma, mantén un ritmo fácil',
        'Caminando De acuerdo especialmente al principio',
        'Bebe agua si pasas de ~90 min',
        'Escucha el cuerpo - no "hero"'
      ],
      mistakes: [
        'Demasiado duro para empezar',
        'Sin líquidos en tiradas largas',
        'Equipo/comida nueva en la semana de carrera'
      ],
      video: { type: 'link', url: ytSearch('long run tips marathon training'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    tempo_cues: {
      id: 'tempo_cues',
      name: 'Tempo / carrera de umbral',
      category: 'juoksu',
      equipment: [],
      benefits: [
        'Levantar el umbral de la lactancia',
        'Mejorar la economía de la velocidad del maratón',
        'Construye una sensación de ritmo alegre pero controlado'
      ],
      cues: [
        'Calentamiento 10-15 minutos fácil',
        'Tempo: al límite de poder hablar, no sprint',
        'Respiración uniforme, hombros relajados',
        'Refrigeración 8-10 min'
      ],
      mistakes: [
        'El tempo se convierte en sprint de intervalos',
        'Sobrecalentamiento',
        'Sin días de recuperación alredecor del tempo'
      ],
      video: { type: 'link', url: ytSearch('carrera tempo / umbral'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    interval_cues: {
      id: 'interval_cues',
      name: 'Intervallit',
      category: 'juoksu',
      equipment: [],
      benefits: [
        'Mejorar VO2max y resistencia a la velocidad',
        'Apoya la preparación para la carrera en la etapa superior',
        'Tehostaa juoksun ekonomiaa'
      ],
      cues: [
        'Calentamiento cuidadoso + unas aceleraciones',
        'Los períodos de trabajo son planos, no espolvos completos',
        'Regreso por jogging / caminar según plan',
        'La forma permanece cansada - corto si el colapso'
      ],
      mistakes: [
        'Las primeras apuestas demasiado duras',
        'Recuperación demasiado corta',
        'Calentamiento pobre'
      ],
      video: { type: 'link', url: ytSearch('interval running form VO2max workout'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    strides_cues: {
      id: 'strides_cues',
      name: 'Kiihdytykset (strides)',
      category: 'juoksu',
      equipment: [],
      benefits: [
        'Mejora la postura de carrera y la activación neuromuscular',
        'Añadir "chispa" sin carga dura',
        'Bueno en fase base/taper'
      ],
      cues: [
        '20 s de aceleración hacia un ritmo vivo, sin sprint máximo',
        'Relajación: cara, hombros, manos',
        'Regreso caminando / jogging 60-90 s',
        'Mantenga la técnica limpia.'
      ],
      mistakes: [
        'Huella completa demasiado pronto',
        'Altura y endurecimiento de los dientes',
        'Demasiada repetición cuando cansado'
      ],
      video: { type: 'link', url: ytSearch('running strides form drill'), label: 'Ver vídeo (búsqueda YouTube)' }
    },

    // ---- Rehab hombro (manguito rotador): carga ligera, rango indoloro ----
    codman_pendulum: {
      id: 'codman_pendulum',
      name: 'Codman-heilurit',
      category: 'liikkuvuus',
      rehab: 'shoulder',
      equipment: ['mesa/silla de apoyo'],
      benefits: [
        'Mueva la articulación del hombro casi sin trabajo muscular - calma la membrana torcida irritada',
        'Mantener el movimiento y la nutrición conjunta durante la inflamación',
        'Buen inicio para cada rutina de rehab y tras el frío'
      ],
      cues: [
        'Apoyar una mano saludable a la mesa, doblar hacia adelante ~ 45-90 °, dolor de mano colgando suelto',
        'Deja que el brazo oscile con el cuerpo: delante–atrás, de lado a lado, círculos pequeños',
        'El hombro está completamente relajado - el movimiento viene del cuerpo, no de los músculos del hombro',
        '30–60 s / suunta, 2–3 kierrosta',
        'Sólo en un área sin dolor - reducir el movimiento si siente dolor'
      ],
      mistakes: [
        'Mueve el brazo con el deltoides (movimiento activo)',
        'Movimiento excesivo o peso en la mano',
        'Los hombros están subiendo.'
      ],
      video: { type: 'link', url: ytSearch('codman pendulum exercise shoulder'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    wall_circles: {
      id: 'wall_circles',
      name: 'Pelota/mano contra la pared – círculos',
      category: 'liikkuvuus',
      rehab: 'shoulder',
      equipment: ['pelota pequeña (opcional)', 'pared'],
      benefits: [
        'Activa el manguito rotador y los estabilizadores del omóplato con suavidad, articulación apoyada',
        'Mejorar el control del hombro y la actitud',
        'Carga baja: cuando los movimientos empiezan a ser indolores'
      ],
      cues: [
        'Ponte frente a la pared, la palma o la bola pequeña contra la pared a la altura del hombro o abajo',
        'Presione la luz (~ 20-36%) hasta los pequeños círculos en la parte delantera y el mostrador',
        'Childback un poco atrás y abajo, cuello suelto',
        '2×10 círculos / dirección',
        'Sólo en un área indoloro - bajar la altura de la mano si siente dolor'
      ],
      mistakes: [
        'Empuje demasiado duro o demasiado alto',
        'Los círculos están hechos con cuerpo, no hombro',
        'El hombro está subiendo'
      ],
      video: { type: 'link', url: ytSearch('ball on wall circles shoulder rehab'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    wall_walk: {
      id: 'wall_walk',
      name: 'Caminata de dedos por la pared',
      category: 'liikkuvuus',
      rehab: 'shoulder',
      equipment: ['pared'],
      benefits: [
        'Retorno de elevación del hombro (flexion) asistido',
        'La pared lleva el peso de la mano - un poco de carga en la película retorcida',
        'Konkreettinen mittari edistymiselle (kuinka korkealle kivutta)'
      ],
      cues: [
        'Ponte delante de la pared al final de la medida del brazo, dedos en la pared a la altura de la cintura',
        '"Camina" con los dedos hacia arriba lentamente, sólo tan alto como puedas conseguir sin dolor',
        'Sostén 2-3 pts, camina los dedos hacia abajo - no te sueltes la mano',
        '2×10 repeticiones; también de lado contra la pared (abducción)',
        'Solo en rango indoloro: el punto alto queda por debajo del dolor'
      ],
      mistakes: [
        'Llegar a la zona del dolor "a estirar"',
        'El hombro sube a las orejas / la espalda se ahueca',
        'Suelte la mano de la posición superior'
      ],
      video: { type: 'link', url: ytSearch('finger wall walk shoulder exercise'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    stick_external_rotation: {
      id: 'stick_external_rotation',
      name: 'Rotación externa pasiva con palo',
      category: 'liikkuvuus',
      rehab: 'shoulder',
      equipment: ['palo / mango de escoba'],
      benefits: [
        'Devuelve la rotación externa sin el trabajo del hombro doloroso',
        'Mano sana hace movimiento - la membrana retorcida descansa',
        'Reduce la rigidez durante la inflamación'
      ],
      cues: [
        'Peso corporal o de pie, codo de la mano dolorido a 90 ° (toalla bajo el codo)',
        'Mantenga el palo con ambas manos; una mano sana empuja hacia fuera la mano dolorida',
        'Una mano dolorida se relaja - sólo con él',
        'Tener 3-5 pts en posición extrema, 2 × 10-15',
        'Solo en rango indoloro: estiramiento suave ok, dolor no'
      ],
      mistakes: [
        'El codo está saliendo del costado.',
        'El dolor de la mano es emocionante y funciona',
        'Forzada a la zona de dolor'
      ],
      video: { type: 'link', url: ytSearch('passive external rotation stick shoulder supine'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    stick_flexion: {
      id: 'stick_flexion',
      name: 'Flexión con palo (tumbada)',
      category: 'liikkuvuus',
      rehab: 'shoulder',
      equipment: ['palo / mango de escoba'],
      benefits: [
        'Elevación asistida – recupera el rango hacia arriba con seguridad',
        'El sabor del cuerpo apoya la paleta y reduce la compensación',
        'Mano sana carga'
      ],
      cues: [
        'Rodillas enganchadas en gancho, pega en ambas manos con agarre en todo el hombro',
        'Levanta el palo con las manos directas hacia el techo y todavía sobre la cabeza - una mano sana conduce',
        'Sólo en cuanto al dolor, cuente lentamente',
        '2×10–15',
        'Solo en el rango indoloro'
      ],
      mistakes: [
        'La zona lumbar se ahueca',
        'Una mano dolorida hace el movimiento solo',
        'Demasiado rápido.'
      ],
      video: { type: 'link', url: ytSearch('supine shoulder flexion with stick wand'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    iso_external_rotation: {
      id: 'iso_external_rotation',
      name: 'Rotación externa isométrica contra la pared',
      category: 'voima',
      rehab: 'shoulder',
      equipment: ['pared / marco de puerta', 'toalla'],
      benefits: [
        'Activa rotadores externos sin movimiento articular – a menudo indoloro desde el inicio',
        'La isometría puede aliviar el dolor tendinoso',
        'Fondo para el trabajo posterior de banda elástica'
      ],
      cues: [
        'De pie contra pared / marco, codo a lado 90 °, toalla enrollada entre codo y lado',
        'Presione la superficie exterior de su mano suavemente contra la pared (~ 20-30% de la fuerza) - la mano no se mueve',
        'Sostenga 5-10 pts, relájese',
        '2–3×10 repeticiones',
        'Sólo en un área indoloro - el empuje debe ser indoloro'
      ],
      mistakes: [
        'Demasiado fuerte.',
        'El hombro se levanta o el cuerpo oscila',
        'Contener la respiración'
      ],
      video: { type: 'link', url: ytSearch('isometric shoulder external rotation wall'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    iso_internal_rotation: {
      id: 'iso_internal_rotation',
      name: 'Rotación interna isométrica contra la pared',
      category: 'voima',
      rehab: 'shoulder',
      equipment: ['pared / marco de puerta', 'toalla'],
      benefits: [
        'Activa rotadores internos (subescapular) sin movimiento articular',
        'Tasapainottaa ulkokiertoharjoittelua',
        'Carga baja: adecuada en fase inflamatoria'
      ],
      cues: [
        'Ponte en la esquina del marco de la puerta, codo a lado 90 ° contra el marco de la palma',
        'Con la mano presiona suavemente hacia adentro (~ 20-30%) - la mano no se mueve',
        'Sostenga 5-10 pts, relájese',
        '2–3×10 repeticiones',
        'Solo en el rango indoloro'
      ],
      mistakes: [
        'Demasiado fuerte.',
        'Los codos se escapan del lado',
        'Su cuerpo está rodando.'
      ],
      video: { type: 'link', url: ytSearch('isometric shoulder internal rotation doorway'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    band_internal_rotation: {
      id: 'band_internal_rotation',
      name: 'Rotación interna con banda (ligera)',
      category: 'voima',
      rehab: 'shoulder',
      equipment: ['banda elástica (muy ligera)'],
      benefits: [
        'Reforzar los propulsores interiores con resistencia a la luz',
        'Tasapainottaa olkanivelen lihaksistoa ulkokierron pariksi',
        'Movimiento pequeño y controlado – poca irritación'
      ],
      cues: [
        'Tapa anclada a la altura del codo a lado, codo a lado 90 ° (entre toalla)',
        'Tira lentamente el antebrazo hacia el abdomen, regresa más lentamente (2-3 pts)',
        'Cinta ligera: 2-3 × 12-15 sin dolor',
        'Hombro abajo, pecho abierto',
        'Solo en el rango indoloro'
      ],
      mistakes: [
        'Cinta rígida',
        'El codo está saliendo del costado.',
        'Rápido, twitching tempo'
      ],
      video: { type: 'link', url: ytSearch('band internal rotation shoulder rehab'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    side_lying_external_rotation: {
      id: 'side_lying_external_rotation',
      name: 'Rotación externa de lado (0–1 kg)',
      category: 'voima',
      rehab: 'shoulder',
      equipment: ['mancuerna 0,5–1 kg (opcional)', 'toalla'],
      benefits: [
        'Uno de los amplificadores más eficaces para rotadores al aire libre (infraspinatus)',
        'La gravedad da una resistencia ligera y uniforme',
        'Empieza sin peso: aumenta solo cuando 3×15 sea indoloro'
      ],
      cues: [
        'Acuéstate en el lado sano, con el codo de la mano dolorida en el lado 90 °, una toalla rodada debajo del codo',
        'Retorcer lentamente el antebrazo hacia arriba hacia el techo, contar 3 pts',
        'Primero sin peso, después 0,5-1 kg; 2 -3 × 10 -15',
        'No mientas sobre un hombro dolorido',
        'Solo en el rango indoloro'
      ],
      mistakes: [
        'Muñeca de sobrepeso',
        'El cuerpo gira hacia atrás',
        'Los codos se levantan del lado'
      ],
      video: { type: 'link', url: ytSearch('side lying external rotation rotator cuff'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    band_row_low: {
      id: 'band_row_low',
      name: 'Remo ligero con banda desde abajo',
      category: 'voima',
      rehab: 'shoulder',
      equipment: ['banda elástica (ligera)'],
      benefits: [
        'Reforzar los músculos de apoyo del hombro (malfuncionamiento de la parte media / inferior, organismos de diamante)',
        'Una buena posición del omóplato alivia la carga del manguito',
        'ángulo de baja tirada - sin manos sobre la cabeza'
      ],
      cues: [
        'Ancla una banda ligera a la altura de la cintura o más baja, manos delante abajo',
        'Tirar las cuchillas del hombro hacia atrás y hacia abajo, luego codos junto a los lados',
        'Retorno lento 2–3 s; 2–3×12–15',
        'Codos abajo al lado del cuerpo - sin altura del hombro',
        'Solo en el rango indoloro'
      ],
      mistakes: [
        'Demasiada resistencia → los hombros suben',
        'Sólo tire con las manos sin hojas de hombro',
        'Los codos se elevan a los lados'
      ],
      video: { type: 'link', url: ytSearch('low row resistance band scapular retraction'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    cross_body_stretch: {
      id: 'cross_body_stretch',
      name: 'Estiramiento de hombro cruzado (suave)',
      category: 'liikkuvuus',
      rehab: 'shoulder',
      equipment: [],
      benefits: [
        'Estreche la parte posterior del hombro y la cápsula articular suavemente',
        'Reduce la tensión en la parte posterior del brazo que puede apretar el brazo superior',
        'Fácil de hacer en cualquier sitio'
      ],
      cues: [
        'Esa mano dolorida sobre el pecho, una mano sana detrás del codo',
        'Sólo tire suavemente - sentir suave estiramiento en la parte posterior del hombro',
        'Hombro abajo, no gires el tronco',
        '20–30 s, 2–3 kertaa',
        'Sólo en un área indoloro - una sensación de pellizco en la parte delantera del hombro = aligerar inmediatamente'
      ],
      mistakes: [
        'Tire con fuerza',
        'Los hombros están subiendo.',
        'Estréguese al dolor'
      ],
      video: { type: 'link', url: ytSearch('gentle cross body shoulder stretch'), label: 'Ver vídeo (búsqueda YouTube)' }
    },

    // ---- Alternativas pierna/core que protegen el hombro ----
    leg_press: {
      id: 'leg_press',
      name: 'Prensa de piernas',
      category: 'voima',
      equipment: ['prensa de piernas (gym)'],
      benefits: [
        'Trabajos pesados sin barra en los hombros - el hombro descansa',
        'Desarrollar muslos delanteros y nalgas para soportar correr',
        'Fácil ajustar la carga'
      ],
      cues: [
        'Atrás y cadera firmemente contra la espalda',
        'Pies al ancho de hombros, rodillas hacia los dedos',
        'Calcular hasta la rodilla ~ 90 °, empujar la base de pie completo',
        'No te apoyes en las manijas con las manos - manos sueltas'
      ],
      mistakes: [
        'La cadera caerá del asiento en la parte inferior',
        'Knees to lock in upper position',
        'Las rodillas se hunden hacia dentro'
      ],
      video: { type: 'link', url: ytSearch('leg press proper form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    wall_sit: {
      id: 'wall_sit',
      name: 'Sentadilla isométrica en pared',
      category: 'voima',
      equipment: ['pared'],
      benefits: [
        'Trabajo isométrico de cuádriceps sin material y sin manos',
        'Fortalecer los músculos de apoyo a las rodillas (resistente a las rodillas dentro de los límites del dolor)',
        'No carga los hombros'
      ],
      cues: [
        'Atrás contra la pared, tierra hasta las rodillas ~ 90 ° (o superior)',
        'Peso en talones, rodillas en tobillos',
        'Manos fáciles en los muslos o lados - no apretar la pared',
        '3×30–60 s'
      ],
      mistakes: [
        'Rodillas por delante de los dedos',
        'Mis manos están empujando mis muslos.',
        'Contener la respiración'
      ],
      video: { type: 'link', url: ytSearch('wall sit exercise form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    sl_rdl_bw: {
      id: 'sl_rdl_bw',
      name: 'RDL a una pierna sin peso',
      category: 'voima',
      equipment: [],
      benefits: [
        'muslos traseros, nalgas y balance del tobillo sin carga a mano',
        'Un control de pierna importante para correr',
        'El hombro descansa - manos sobre las caderas'
      ],
      cues: [
        'Ponte en una pierna, rodilla suave, manos en las caderas',
        'inclinado de la cadera al frente, pie libre hacia atrás - espalda recta',
        'Regresar con la nalgada arriba; 3 × 8 -10 / pie',
        'Si es necesario, apoyarse en la pared con una mano sana'
      ],
      mistakes: [
        'Redondeado',
        'La pelvis se abre/rota',
        'Tukipolvi lukossa'
      ],
      video: { type: 'link', url: ytSearch('single leg romanian deadlift bodyweight'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    step_up_bw: {
      id: 'step_up_bw',
      name: 'Step-up sin peso',
      category: 'voima',
      equipment: ['step / escalón'],
      benefits: [
        'Fuerza a una pierna y control de rodilla',
        'Presión de la cabeza',
        'Sin carga en las manos'
      ],
      cues: [
        'Toda la planta en el escalón; sube con la pierna delantera',
        'Arrodíllate, cuerpo arriba.',
        'Baja con control; 3×10 por pierna',
        'Manos relajadas - no muñecos en el hombro'
      ],
      mistakes: [
        'Ponnistaa takajalalla',
        'La rodilla está cayendo.',
        'Escalón demasiado alto'
      ],
      video: { type: 'link', url: ytSearch('bodyweight step up form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    reverse_crunch: {
      id: 'reverse_crunch',
      name: 'Crunch inverso',
      category: 'voima',
      equipment: [],
      benefits: [
        'Control de abdomen bajo y pelvis tumbada boca arriba',
        'Manos en el suelo relajadas - sin carga de hombro',
        'Reemplazar la rueda de ab y la tabala en el espacio de hombro'
      ],
      cues: [
        'Sabor de la correa, manos en el piso lateral relajadas, rodillas 90 °',
        'Twist la pelvis del suelo con abdominales, rodillas hacia el pecho',
        'Baja lento 3 s; 3×10–12',
        'No presione con las manos en el suelo'
      ],
      mistakes: [
        'Impulsa con balanceo de piernas',
        'Presiona con las manos',
        'Bajada demasiado rápida'
      ],
      video: { type: 'link', url: ytSearch('reverse crunch proper form'), label: 'Ver vídeo (búsqueda YouTube)' }
    },

    // ---- Kuntoutus-/vinkkiliikkeet (konservatiiviset treenivinkit) ----
    calf_raise_eccentric: {
      id: 'calf_raise_eccentric',
      name: 'Eksentrinen pohjenosto',
      category: 'voima',
      equipment: ['step'],
      benefits: [
        'Carga Aquiles y gemelo de forma controlada',
        'Carga de tendón progresiva general (punto de entrenamiento)',
        'Apoya la fuerza excéntrica en los terneros'
      ],
      cues: [
        'Levántate con dos piernas.',
        'Poco a poco cuenta 3-4 pts a un pie',
        '♪ Fechas en el grifo, eres libre de estirar ♪',
        'Dolor ≤ 3 / 10 - Stop if pain rises after exercise'
      ],
      mistakes: [
        'Bajada demasiado rápida',
        'Maksimikipuun asti pakottaminen',
        'Aumento del volumen'
      ],
      video: { type: 'link', url: ytSearch('eccentric calf raise achilles'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    band_external_rotation: {
      id: 'band_external_rotation',
      name: 'Rotación externa con banda (ligera)',
      category: 'voima',
      rehab: 'shoulder',
      equipment: ['banda elástica'],
      benefits: [
        'Reforzar los rotadores externos de la película giratoria',
        'Apoya el control del hombro',
        'Buen trabajo ligero de hombro sin press pesado'
      ],
      cues: [
        'Codo en el lado ~ 90 °',
        'Gire el antebrazo contra la cinta',
        'vuelo Tempo, basta un movimiento pequeño - venda más ligera, 2-3 × 12 -15',
        'Hombro abajo – no lo encajes hacia la oreja',
        'Toalla enrollada entre el codo y el lado para facilitar la posición',
        'Solo en el rango indoloro'
      ],
      mistakes: [
        'El codo está saliendo del costado.',
        'cinta rígida / movimiento demasiado grande',
        'elevación del hombro'
      ],
      video: { type: 'link', url: ytSearch('band external rotation rotator cuff'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    scap_squeeze: {
      id: 'scap_squeeze',
      name: 'Lapaluiden puristus',
      category: 'liikkuvuus',
      rehab: 'shoulder',
      equipment: [],
      benefits: [
        'Activa espalda alta y estabilizadores del omóplato',
        'Apoya la posición del hombro',
        'Fácil para calentar o en pausas'
      ],
      cues: [
        'De pie o sentado: apretar las cuchillas del hombro juntas',
        'Atrás y un poco abajo, espera 3 -5 pts, relájate',
        '2–3×12–15 repeticiones',
        'Pecho abierto, cuello relajado',
        'Solo en el rango indoloro'
      ],
      mistakes: [
        'Sube los hombros hacia las orejas',
        'Bota Excesiva en la parte inferior de la espalda',
        'Mantenga la respiración'
      ],
      video: { type: 'link', url: ytSearch('scapular squeeze exercise'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    glute_med_side_lie: {
      id: 'glute_med_side_lie',
      name: 'Glute- -hip stretch (glute med)',
      category: 'voima',
      equipment: [],
      benefits: [
        'Tacones medianos reforzados',
        'Apoya el control de cadera en funcionamiento',
        'Útil para controlar la carga de la banda IT y la rodilla (consejo)'
      ],
      cues: [
        'De lado, tren inferior alineado',
        'Lift top foot to side sin rotación hacia delante',
        'Tempo vuelo 8-12 juego / lado',
        'Cuerpo estable - no caer de vuelta'
      ],
      mistakes: [
        'Heiluttaa vartaloa',
        'Pie de rotación hacia adelante (indemnización del FFT)',
        'Demasiado rápido.'
      ],
      video: { type: 'link', url: ytSearch('side lying hip abduction glute med'), label: 'Ver vídeo (búsqueda YouTube)' }
    },
    towel_stretch_foot: {
      id: 'towel_stretch_foot',
      name: 'Estiramiento con toalla del pie',
      category: 'liikkuvuus',
      equipment: ['toalla'],
      benefits: [
        'Estreche la base y la membrana base suavemente',
        'Yleinen aamu-/iltarutiini plantaarikivun kevennykseen (treenivinkki)',
        'Fácil en casa sin material (basta una toalla)'
      ],
      cues: [
        'Siéntate, toalla alrededor del pie',
        'Tire suavemente hacia los dedos de los pies - sensación de estiramiento en el becerro / fondo',
        '20–30 s, 2–3 kertaa',
        'Ligero estiramiento bien, dolor agudo no'
      ],
      mistakes: [
        'Tos con fuerza',
        'Forzar una posición extrema dolorosa',
        'Olvida la pierna contraria'
      ],
      video: { type: 'link', url: ytSearch('towel stretch plantar fascia'), label: 'Ver vídeo (búsqueda YouTube)' }
    }
  };

  function getExercise(id) {
    return EXERCISES[id] || null;
  }

  function listExercises(category) {
    return Object.values(EXERCISES).filter((e) => !category || e.category === category);
  }

  function allIds() {
    return Object.keys(EXERCISES);
  }

  /** ¿Carga el hombro (manguito)? id desconocido → false. */
  function loadsShoulder(id) {
    const e = EXERCISES[id];
    return !!(e && e.loadsShoulder);
  }

  /** Ejercicios de rehab de hombro (rehab: 'shoulder'). */
  function shoulderRehabExercises() {
    return Object.values(EXERCISES).filter((e) => e.rehab === 'shoulder');
  }

  function embedUrl(ex) {
    if (!ex || !ex.video || ex.video.type !== 'embed' || !ex.video.youtubeId) return null;
    return ytEmbed(ex.video.youtubeId);
  }

  function externalUrl(ex) {
    if (!ex || !ex.video) return null;
    if (ex.video.type === 'embed' && ex.video.youtubeId) return ytWatch(ex.video.youtubeId);
    return ex.video.url || null;
  }

  /* ---------- Búsqueda: nombre, categoría, material, grupos musculares, consejos ---------- */
  const CATEGORY_LABEL = { voima: 'Fuerza', juoksu: 'Carrera', liikkuvuus: 'Movilidad' };

  /** Minúsculas + sin tildes (á→a, ñ→n): la búsqueda no distingue acentos ni mayúsculas. */
  function normalizeSearch(str) {
    let t = String(str == null ? '' : str).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Grupos musculares / palabras cotidianas → raíces que aparecen en los textos de los ejercicios
  const SEARCH_SYNONYMS = {
    piernas: ['pierna', 'muslo', 'cuadricep', 'isquio', 'sentadilla', 'zancada', 'gemelo', 'glute'],
    pierna: ['pierna', 'muslo', 'cuadricep', 'isquio', 'gemelo', 'glute'],
    muslos: ['muslo', 'cuadricep', 'isquio'], muslo: ['muslo', 'cuadricep', 'isquio'],
    cuadriceps: ['cuadricep', 'muslos delanter', 'muslo delanter', 'quad'],
    isquios: ['isquio', 'femoral', 'hamstring'], isquiotibiales: ['isquio', 'femoral', 'hamstring'], femoral: ['isquio', 'femoral'],
    gluteos: ['glute', 'cadera', 'puente', 'hip thrust'], gluteo: ['glute', 'cadera'], culo: ['glute'], pompis: ['glute'],
    gemelos: ['gemelo', 'pantorrilla', 'soleo', 'aquiles', 'calf'], gemelo: ['gemelo', 'pantorrilla', 'soleo'], pantorrillas: ['gemelo', 'pantorrilla', 'soleo'],
    abdomen: ['abdom', 'core', 'plancha', 'cuerpo medio', 'tronco'], abdominales: ['abdom', 'core', 'plancha'], abs: ['abdom', 'core', 'plancha'],
    core: ['core', 'abdom', 'plancha', 'cuerpo medio', 'tronco'], tronco: ['tronco', 'core', 'abdom'],
    espalda: ['espalda', 'escapul', 'remo', 'dominad', 'dorsal', 'lumbar'], lumbar: ['lumbar', 'espalda baja'], dorsales: ['dorsal', 'remo', 'dominad'],
    pecho: ['pecho', 'pector', 'flexion', 'press banca'], brazos: ['brazo', 'bicep', 'tricep', 'flexion'], biceps: ['bicep', 'curl'], triceps: ['tricep', 'fondo'],
    hombro: ['hombro', 'manguito', 'deltoid', 'escapul'], hombros: ['hombro', 'manguito', 'deltoid'],
    cadera: ['cadera', 'glute', 'psoas'], caderas: ['cadera', 'glute'], tobillo: ['tobillo'], tobillos: ['tobillo'], rodilla: ['rodilla'], rodillas: ['rodilla'],
    estiramiento: ['estir', 'movilidad'], estiramientos: ['estir', 'movilidad'], movilidad: ['movilidad', 'estir'],
    rehabilitacion: ['rehab', 'rehabilit'], rehab: ['rehab', 'rehabilit'],
    correr: ['carrera', 'correr', 'zancada'], carrera: ['carrera', 'correr'], equilibrio: ['equilibrio', 'una pierna', 'estabilidad'],
    casa: ['casa', 'sin material', 'peso corporal'], goma: ['goma', 'banda', 'elastic'], banda: ['banda', 'goma', 'elastic'],
    mancuerna: ['mancuerna'], mancuernas: ['mancuerna'], barra: ['barra'], kettlebell: ['kettlebell', 'pesa rusa']
  };

  function searchIndex(ex) {
    if (!ex) return '';
    if (ex._search) return ex._search;
    const parts = [ex.name, ex.id && ex.id.replace(/_/g, ' '), ex.category, CATEGORY_LABEL[ex.category],
      (ex.equipment || []).join(' '), (ex.equipment || []).length ? '' : 'sin material peso corporal',
      ex.rehab === 'shoulder' ? 'hombro rehabilitacion rehab' : '',
      (ex.benefits || []).join(' '), (ex.cues || []).join(' '), (ex.mistakes || []).join(' '),
      ex.video && ex.video.label];
    const idx = ' ' + normalizeSearch(parts.filter(Boolean).join(' ')) + ' ';
    try { Object.defineProperty(ex, '_search', { value: idx, enumerable: false, configurable: true }); } catch (e) { /* congelado */ }
    return idx;
  }

  /**
   * Filtra ejercicios por texto. Cada palabra debe coincidir (nombre, categoría, material, beneficios/consejos/errores
   * o sinónimo de grupo muscular). Coincidencias en el nombre primero; si no, orden original. Búsqueda vacía → lista tal cual.
   */
  function searchExercises(query, list) {
    const items = Array.isArray(list) ? list : listExercises();
    const q = normalizeSearch(query);
    if (!q) return items.slice();
    const tokens = q.split(' ').filter(Boolean);
    const scored = [];
    items.forEach(function (ex, i) {
      const idx = searchIndex(ex);
      const name = ' ' + normalizeSearch(ex.name) + ' ';
      let score = 0;
      for (let t = 0; t < tokens.length; t++) {
        const tok = tokens[t];
        if (name.indexOf(' ' + tok) >= 0) { score += 3; continue; }
        if (name.indexOf(tok) >= 0) { score += 2; continue; }
        if (idx.indexOf(tok) >= 0) { score += 1; continue; }
        const syn = SEARCH_SYNONYMS[tok];
        if (syn && syn.some(function (sv) { return idx.indexOf(sv) >= 0; })) { score += 1; continue; }
        return;
      }
      scored.push({ ex: ex, score: score, i: i });
    });
    scored.sort(function (a, b) { return b.score - a.score || a.i - b.i; });
    return scored.map(function (x) { return x.ex; });
  }

  global.TreeniExercises = {
    EXERCISES,
    CATEGORY_LABEL,
    normalizeSearch,
    searchExercises,
    getExercise,
    listExercises,
    allIds,
    loadsShoulder,
    shoulderRehabExercises,
    embedUrl,
    externalUrl,
    ytEmbed,
    ytWatch,
    ytSearch
  };
})(typeof window !== 'undefined' ? window : global);
