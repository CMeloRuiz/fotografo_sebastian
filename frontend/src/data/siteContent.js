/**
 * Contenido editable del sitio.
 *
 * Todo lo que hay aqui es el contenido real del sitio antiguo, migrado tal
 * cual salvo las correcciones de redaccion listadas en el README. En la
 * Fase 3 el backend sirve exactamente esta misma forma desde la tabla
 * site_content, y este archivo pasa a ser el valor por defecto cuando la
 * API no responde, para que el sitio nunca se vea vacio.
 *
 * Los campos marcados con PENDIENTE son datos de ejemplo porque el sitio
 * original tampoco los tenia; el fotografo los reemplaza desde el panel.
 */

export const siteContent = {
  identity: {
    name: 'Sebastián Sisa',
    role: 'Productora audiovisual',
    shortBio:
      'Fotografía y filmmaking para eventos sociales y publicidad en Villapinzón y toda Cundinamarca.',
  },

  hero: {
    eyebrow: 'Productora audiovisual',
    title: 'La calidad no se improvisa, se crea en cada toma',
    subtitle:
      'Fotografía y video para matrimonios, quince años, bautizos y eventos musicales. Cada recuerdo, contado como merece.',
    primaryCta: { label: 'Ver portafolio', href: '/portafolio' },
    secondaryCta: { label: 'Cotizar por WhatsApp', href: 'whatsapp' },
  },

  about: {
    eyebrow: 'Conóceme un poco',
    title: '¿Quién soy?',
    intro: 'Hola, soy Sebastián',
    paragraphs: [
      'Tengo 20 años y soy de Villapinzón. Me dedico a capturar momentos únicos. Me especializo en fotografía y filmmaking para eventos sociales y publicidad, siempre buscando que cada imagen cuente una historia y transmita emociones reales.',
      'Desde muy joven el arte ha sido parte de mi vida, y cuando la cámara llegó a mis manos, lo que empezó como un pasatiempo se convirtió en mi mayor pasión.',
      'Mi objetivo es crear imágenes y videos con energía, autenticidad y un toque creativo que los haga memorables. Más que un servicio, ofrezco una experiencia cercana, cómoda y profesional para que cada recuerdo quede plasmado de la mejor manera.',
    ],
  },

  stats: [
    { value: 2023, label: 'Inicio', format: 'plain' },
    { value: 87, label: 'Clientes', format: 'count' },
    { value: 17, label: 'Alianzas', format: 'count' },
  ],

  /**
   * Categorias de evento. Las portadas quedan pendientes: las del sitio
   * antiguo son fotos de clientes y no se pueden reutilizar, asi que se
   * llenan con las imagenes de demostracion generadas con IA y el
   * fotografo las reemplaza por las suyas desde el panel.
   */
  categories: [
    { slug: 'matrimonios', name: 'Matrimonios', blurb: 'El día que lo cambia todo, de principio a fin.' },
    { slug: 'quince-anos', name: 'Quince años', blurb: 'La fiesta, el vestido y cada detalle que soñaste.' },
    { slug: 'bautizos', name: 'Bautizos', blurb: 'Los primeros recuerdos de la familia.' },
    { slug: 'eventos-musicales', name: 'Eventos musicales', blurb: 'Videoclips y conciertos con energía real.' },
    { slug: 'retratos', name: 'Retratos', blurb: 'Sesiones de estudio y exteriores.' },
    { slug: 'comercial', name: 'Comercial', blurb: 'Producto, publicidad y dron para tu marca.' },
  ],

  services: [
    {
      slug: 'eventos-sociales',
      title: 'Cubrimiento de eventos sociales',
      description: 'Capturo la magia y la emoción de tus momentos más especiales.',
      features: ['Bodas y celebraciones', 'Eventos corporativos', 'Fiestas de XV años'],
      priceLabel: 'Cotizar',
      image: 'serviceEvents',
    },
    {
      slug: 'videografia',
      title: 'Videografía',
      description: 'Narro tu historia a través de imágenes en movimiento.',
      features: ['Videoclips musicales', 'Publicidad'],
      priceLabel: 'Cotizar',
      image: 'serviceVideo',
    },
    {
      slug: 'sesiones-estudio',
      title: 'Sesiones de estudio',
      description: 'Resalto tu mejor versión en cada fotografía.',
      features: [
        'Fotografía de embarazadas',
        'Retratos familiares',
        'Sesión de pareja',
        'Sesión de XV años',
      ],
      priceLabel: 'Cotizar',
      image: 'servicePortrait',
    },
    {
      slug: 'comercial',
      title: 'Fotografía comercial',
      description: 'Dale vida a tu marca con imágenes profesionales.',
      features: ['Productos', 'Publicidad', 'Dron'],
      priceLabel: 'Cotizar',
      image: 'serviceCommercial',
    },
  ],

  process: {
    eyebrow: 'Cómo trabajo',
    title: 'De la primera idea al recuerdo final',
    steps: [
      {
        n: '01',
        title: 'Hablamos',
        text: 'Me cuentas qué celebras, dónde y cuándo. Resolvemos dudas por WhatsApp, sin compromiso.',
      },
      {
        n: '02',
        title: 'Planeamos',
        text: 'Armamos el cronograma del día, los momentos imprescindibles y el estilo que quieres.',
      },
      {
        n: '03',
        title: 'Grabamos',
        text: 'El día del evento me muevo sin estorbar. Tú disfrutas; yo me encargo del resto.',
      },
      {
        n: '04',
        title: 'Entrego',
        text: 'Recibes tu galería editada en línea, lista para descargar y compartir con quien quieras.',
      },
    ],
  },

  whyMe: {
    eyebrow: 'Por qué elegirme',
    title: 'Lo que recibes conmigo',
    points: [
      { title: 'Trato cercano', text: 'Hablas directamente conmigo, no con un intermediario.' },
      { title: 'Entrega puntual', text: 'Fecha de entrega acordada desde el primer día y cumplida.' },
      { title: 'Foto y video', text: 'Un solo equipo para todo: no coordinas dos proveedores.' },
      { title: 'Galería en línea', text: 'Tus fotos en alta resolución, disponibles para descargar.' },
    ],
  },

  /** PENDIENTE: testimonios de ejemplo. El fotógrafo los reemplaza desde el panel. */
  testimonials: [
    {
      id: 'demo-1',
      author: 'Nombre del cliente',
      eventType: 'Matrimonio',
      text: 'Texto de ejemplo. Reemplaza este testimonio desde el panel de administración con una reseña real de tus clientes.',
      isDemo: true,
    },
    {
      id: 'demo-2',
      author: 'Nombre del cliente',
      eventType: 'Quince años',
      text: 'Texto de ejemplo. Reemplaza este testimonio desde el panel de administración con una reseña real de tus clientes.',
      isDemo: true,
    },
    {
      id: 'demo-3',
      author: 'Nombre del cliente',
      eventType: 'Bautizo',
      text: 'Texto de ejemplo. Reemplaza este testimonio desde el panel de administración con una reseña real de tus clientes.',
      isDemo: true,
    },
  ],

  contact: {
    /** PENDIENTE: datos heredados del sitio antiguo; confirmar que son los reales. */
    address: 'Parque Principal, Villapinzón, Cundinamarca',
    phone: '+57 321 123 4567',
    whatsapp: '573211234567',
    whatsappMessage: 'Hola Sebastián, vi tu portafolio y quiero cotizar la cobertura de mi evento.',
    email: 'info@fotografo.com',
    schedule: 'Lun - Sáb: 9:00 - 18:00',
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3974.337784543244!2d-73.59531742424517!3d5.215833037931789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e403c88c22c5555%3A0x106f6e4e7cc4a8eb!2sParque%20Principal%20de%20Villapinz%C3%B3n!5e0!3m2!1ses!2sco!4v1691864006963!5m2!1ses!2sco',
  },

  /** PENDIENTE: en el sitio antiguo todos los enlaces sociales eran href="#". */
  social: [
    { network: 'instagram', label: 'Instagram', url: '' },
    { network: 'facebook', label: 'Facebook', url: '' },
    { network: 'youtube', label: 'YouTube', url: '' },
    { network: 'tiktok', label: 'TikTok', url: '' },
  ],

  footer: {
    tagline:
      'Capturando momentos únicos y creando recuerdos inolvidables. Fotografía y video para eventos sociales, retratos y contenido comercial en Villapinzón y Cundinamarca.',
  },

  eventTypes: [
    'Matrimonio',
    'Quince años',
    'Bautizo',
    'Evento musical',
    'Sesión de retrato',
    'Comercial / producto',
    'Otro',
  ],
};

export default siteContent;
