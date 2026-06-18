import {
  Activity,
  Award,
  Backpack,
  Banknote,
  Bed,
  Bike,
  BookOpen,
  BriefcaseBusiness,
  Brain,
  Brush,
  Calculator,
  Calendar,
  Camera,
  Car,
  ChefHat,
  ChartNoAxesColumn,
  Church,
  CircleHelp,
  ClipboardCheck,
  Clock,
  Coffee,
  Coins,
  Compass,
  Dumbbell,
  Earth,
  Feather,
  FileText,
  Flower,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  HandHeart,
  Handshake,
  Heart,
  HeartPulse,
  Home,
  Landmark,
  Languages,
  Laptop,
  Leaf,
  Lightbulb,
  ListChecks,
  Map,
  Medal,
  MessageCircle,
  Mic,
  Moon,
  Mountain,
  Music,
  Newspaper,
  NotebookPen,
  Palette,
  PawPrint,
  PenLine,
  PersonStanding,
  Plane,
  Presentation,
  Rocket,
  Route,
  Scale,
  School,
  Send,
  Shapes,
  Shield,
  Shirt,
  ShoppingBasket,
  Smile,
  Sparkles,
  Sprout,
  Star,
  Stethoscope,
  Sun,
  Target,
  Tent,
  TreePalm,
  Trophy,
  Utensils,
  Users,
  WalletCards,
  Waves,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { CategoryIconKey } from '@/domain/categories'

export type CategoryIconGroup =
  | 'health'
  | 'work'
  | 'relationships'
  | 'learning'
  | 'finance'
  | 'home'
  | 'creativity'
  | 'growth'
  | 'leisure'
  | 'travel'
  | 'reflection'
  | 'general'

export type CategoryIconDefinition = {
  key: CategoryIconKey
  component: LucideIcon
  labelMessageId: string
  keywords: {
    en: string[]
    es: string[]
  }
  group: CategoryIconGroup
}

const icon = (
  key: CategoryIconKey,
  component: LucideIcon,
  group: CategoryIconGroup,
  en: string[],
  es: string[],
): CategoryIconDefinition => ({
  key,
  component,
  group,
  labelMessageId: `category.icon.${key}`,
  keywords: { en, es },
})

export const CATEGORY_ICON_DEFINITIONS = [
  icon(
    'activity',
    Activity,
    'health',
    ['activity', 'movement', 'active'],
    ['actividad', 'movimiento'],
  ),
  icon('award', Award, 'growth', ['award', 'achievement', 'recognition'], ['premio', 'logro']),
  icon(
    'backpack',
    Backpack,
    'learning',
    ['backpack', 'school', 'study'],
    ['mochila', 'escuela', 'estudio'],
  ),
  icon(
    'banknote',
    Banknote,
    'finance',
    ['money', 'cash', 'income'],
    ['dinero', 'efectivo', 'ingresos'],
  ),
  icon('bed', Bed, 'health', ['sleep', 'rest', 'bed'], ['dormir', 'descanso', 'cama']),
  icon('bike', Bike, 'health', ['bike', 'cycling', 'sport'], ['bici', 'ciclismo', 'deporte']),
  icon(
    'bookOpen',
    BookOpen,
    'learning',
    ['book', 'reading', 'learning'],
    ['libro', 'lectura', 'aprendizaje'],
  ),
  icon(
    'briefcase',
    BriefcaseBusiness,
    'work',
    ['work', 'career', 'business'],
    ['trabajo', 'carrera', 'negocio'],
  ),
  icon('brain', Brain, 'learning', ['brain', 'mind', 'focus'], ['cerebro', 'mente', 'foco']),
  icon('brush', Brush, 'creativity', ['brush', 'paint', 'art'], ['pincel', 'pintura', 'arte']),
  icon(
    'calculator',
    Calculator,
    'finance',
    ['calculator', 'numbers', 'accounting'],
    ['calculadora', 'numeros', 'contabilidad'],
  ),
  icon(
    'calendar',
    Calendar,
    'general',
    ['calendar', 'planning', 'schedule'],
    ['calendario', 'planificacion', 'agenda'],
  ),
  icon(
    'camera',
    Camera,
    'creativity',
    ['camera', 'photo', 'photography'],
    ['camara', 'foto', 'fotografia'],
  ),
  icon('car', Car, 'travel', ['car', 'driving', 'transport'], ['coche', 'conducir', 'transporte']),
  icon('chefHat', ChefHat, 'home', ['cooking', 'food', 'kitchen'], ['cocina', 'comida', 'cocinar']),
  icon(
    'chartNoAxesColumn',
    ChartNoAxesColumn,
    'work',
    ['chart', 'metrics', 'progress'],
    ['grafico', 'metricas', 'progreso'],
  ),
  icon(
    'church',
    Church,
    'reflection',
    ['faith', 'spirituality', 'church'],
    ['fe', 'espiritualidad', 'iglesia'],
  ),
  icon(
    'circleHelp',
    CircleHelp,
    'general',
    ['help', 'unknown', 'question'],
    ['ayuda', 'desconocido', 'pregunta'],
  ),
  icon(
    'clipboardCheck',
    ClipboardCheck,
    'work',
    ['checklist', 'tasks', 'process'],
    ['lista', 'tareas', 'proceso'],
  ),
  icon('clock', Clock, 'general', ['time', 'routine', 'clock'], ['tiempo', 'rutina', 'reloj']),
  icon('coffee', Coffee, 'leisure', ['coffee', 'break', 'ritual'], ['cafe', 'descanso', 'ritual']),
  icon(
    'coins',
    Coins,
    'finance',
    ['coins', 'savings', 'budget'],
    ['monedas', 'ahorro', 'presupuesto'],
  ),
  icon(
    'compass',
    Compass,
    'travel',
    ['compass', 'direction', 'orientation'],
    ['brujula', 'direccion', 'orientacion'],
  ),
  icon(
    'dumbbell',
    Dumbbell,
    'health',
    ['fitness', 'gym', 'exercise', 'training'],
    ['fitness', 'gimnasio', 'ejercicio', 'entrenamiento', 'deporte'],
  ),
  icon('earth', Earth, 'travel', ['earth', 'world', 'global'], ['tierra', 'mundo', 'global']),
  icon(
    'feather',
    Feather,
    'creativity',
    ['writing', 'journal', 'lightness'],
    ['escritura', 'diario', 'ligereza'],
  ),
  icon(
    'fileText',
    FileText,
    'work',
    ['document', 'paperwork', 'writing'],
    ['documento', 'papeles', 'escritura'],
  ),
  icon('flower', Flower, 'home', ['flower', 'garden', 'beauty'], ['flor', 'jardin', 'belleza']),
  icon('gamepad', Gamepad2, 'leisure', ['games', 'play', 'fun'], ['juegos', 'jugar', 'diversion']),
  icon(
    'general',
    Shapes,
    'general',
    ['general', 'shapes', 'category'],
    ['general', 'formas', 'categoria'],
  ),
  icon(
    'gift',
    Gift,
    'relationships',
    ['gift', 'generosity', 'celebration'],
    ['regalo', 'generosidad', 'celebracion'],
  ),
  icon('globe', Globe, 'travel', ['travel', 'world', 'languages'], ['viaje', 'mundo', 'idiomas']),
  icon(
    'graduationCap',
    GraduationCap,
    'learning',
    ['education', 'degree', 'school'],
    ['educacion', 'titulo', 'escuela'],
  ),
  icon(
    'handHeart',
    HandHeart,
    'relationships',
    ['care', 'support', 'kindness'],
    ['cuidado', 'apoyo', 'amabilidad'],
  ),
  icon(
    'handshake',
    Handshake,
    'relationships',
    ['agreement', 'community', 'partnership'],
    ['acuerdo', 'comunidad', 'colaboracion'],
  ),
  icon(
    'heart',
    Heart,
    'relationships',
    ['love', 'relationships', 'family'],
    ['amor', 'relaciones', 'familia'],
  ),
  icon(
    'heartPulse',
    HeartPulse,
    'health',
    ['health', 'wellbeing', 'heart'],
    ['salud', 'bienestar', 'corazon'],
  ),
  icon('home', Home, 'home', ['home', 'house', 'family'], ['hogar', 'casa', 'familia']),
  icon(
    'landmark',
    Landmark,
    'finance',
    ['bank', 'institution', 'finance'],
    ['banco', 'institucion', 'finanzas'],
  ),
  icon(
    'languages',
    Languages,
    'learning',
    ['language', 'english', 'spanish'],
    ['idioma', 'ingles', 'espanol'],
  ),
  icon(
    'laptop',
    Laptop,
    'work',
    ['computer', 'tech', 'remote work'],
    ['ordenador', 'tecnologia', 'teletrabajo'],
  ),
  icon(
    'leaf',
    Leaf,
    'reflection',
    ['nature', 'calm', 'ecology'],
    ['naturaleza', 'calma', 'ecologia'],
  ),
  icon(
    'lightbulb',
    Lightbulb,
    'growth',
    ['idea', 'insight', 'learning'],
    ['idea', 'claridad', 'aprendizaje'],
  ),
  icon(
    'listChecks',
    ListChecks,
    'work',
    ['list', 'checks', 'tasks'],
    ['lista', 'checks', 'tareas'],
  ),
  icon('map', Map, 'travel', ['map', 'trip', 'explore'], ['mapa', 'viaje', 'explorar']),
  icon('medal', Medal, 'growth', ['medal', 'progress', 'win'], ['medalla', 'progreso', 'ganar']),
  icon(
    'messageCircle',
    MessageCircle,
    'relationships',
    ['conversation', 'social', 'message'],
    ['conversacion', 'social', 'mensaje'],
  ),
  icon('mic', Mic, 'creativity', ['voice', 'singing', 'podcast'], ['voz', 'canto', 'podcast']),
  icon(
    'moon',
    Moon,
    'reflection',
    ['night', 'sleep', 'reflection'],
    ['noche', 'sueno', 'reflexion'],
  ),
  icon(
    'mountain',
    Mountain,
    'growth',
    ['challenge', 'outdoors', 'climb'],
    ['reto', 'aire libre', 'subir'],
  ),
  icon(
    'music',
    Music,
    'creativity',
    ['music', 'practice', 'song'],
    ['musica', 'practica', 'cancion'],
  ),
  icon(
    'newspaper',
    Newspaper,
    'learning',
    ['news', 'reading', 'current events'],
    ['noticias', 'lectura', 'actualidad'],
  ),
  icon(
    'notebookPen',
    NotebookPen,
    'learning',
    ['notebook', 'study', 'notes'],
    ['cuaderno', 'estudio', 'notas'],
  ),
  icon(
    'palette',
    Palette,
    'creativity',
    ['creativity', 'art', 'design'],
    ['creatividad', 'arte', 'diseno'],
  ),
  icon(
    'pawPrint',
    PawPrint,
    'home',
    ['pets', 'animals', 'care'],
    ['mascotas', 'animales', 'cuidado'],
  ),
  icon(
    'penLine',
    PenLine,
    'creativity',
    ['write', 'notes', 'journal'],
    ['escribir', 'notas', 'diario'],
  ),
  icon(
    'personStanding',
    PersonStanding,
    'health',
    ['stretch', 'posture', 'body'],
    ['estirar', 'postura', 'cuerpo'],
  ),
  icon(
    'plane',
    Plane,
    'travel',
    ['flight', 'travel', 'vacation'],
    ['vuelo', 'viaje', 'vacaciones'],
  ),
  icon(
    'plant',
    Sprout,
    'home',
    ['plants', 'garden', 'growth'],
    ['plantas', 'jardin', 'crecimiento'],
  ),
  icon(
    'presentation',
    Presentation,
    'work',
    ['presentation', 'meeting', 'talk'],
    ['presentacion', 'reunion', 'charla'],
  ),
  icon(
    'rocket',
    Rocket,
    'work',
    ['startup', 'launch', 'ambition'],
    ['startup', 'lanzamiento', 'ambicion'],
  ),
  icon('route', Route, 'travel', ['route', 'journey', 'path'], ['ruta', 'camino', 'recorrido']),
  icon(
    'scale',
    Scale,
    'growth',
    ['balance', 'values', 'justice'],
    ['equilibrio', 'valores', 'justicia'],
  ),
  icon('school', School, 'learning', ['school', 'class', 'study'], ['escuela', 'clase', 'estudio']),
  icon(
    'send',
    Send,
    'work',
    ['send', 'communication', 'email'],
    ['enviar', 'comunicacion', 'correo'],
  ),
  icon(
    'shield',
    Shield,
    'health',
    ['protection', 'safety', 'security'],
    ['proteccion', 'seguridad'],
  ),
  icon('shirt', Shirt, 'home', ['clothes', 'laundry', 'style'], ['ropa', 'lavanderia', 'estilo']),
  icon(
    'shoppingBasket',
    ShoppingBasket,
    'home',
    ['shopping', 'groceries', 'errands'],
    ['compras', 'supermercado', 'recados'],
  ),
  icon('smile', Smile, 'relationships', ['mood', 'joy', 'happy'], ['animo', 'alegria', 'feliz']),
  icon(
    'sparkles',
    Sparkles,
    'growth',
    ['sparkles', 'joy', 'magic'],
    ['brillo', 'alegria', 'magia'],
  ),
  icon(
    'sprout',
    Sprout,
    'growth',
    ['growth', 'plant', 'habit'],
    ['crecimiento', 'planta', 'habito'],
  ),
  icon('star', Star, 'growth', ['star', 'priority', 'goal'], ['estrella', 'prioridad', 'objetivo']),
  icon(
    'stethoscope',
    Stethoscope,
    'health',
    ['doctor', 'medical', 'health'],
    ['medico', 'doctor', 'salud'],
  ),
  icon('sun', Sun, 'health', ['morning', 'energy', 'sun'], ['manana', 'energia', 'sol']),
  icon('target', Target, 'growth', ['goal', 'focus', 'target'], ['objetivo', 'foco', 'meta']),
  icon(
    'tent',
    Tent,
    'leisure',
    ['camping', 'outdoors', 'adventure'],
    ['camping', 'aire libre', 'aventura'],
  ),
  icon(
    'treePalm',
    TreePalm,
    'travel',
    ['vacation', 'beach', 'rest'],
    ['vacaciones', 'playa', 'descanso'],
  ),
  icon('trophy', Trophy, 'growth', ['trophy', 'win', 'success'], ['trofeo', 'ganar', 'exito']),
  icon(
    'uncategorized',
    CircleHelp,
    'general',
    ['uncategorized', 'unknown', 'general'],
    ['sin categoria', 'general'],
  ),
  icon(
    'utensils',
    Utensils,
    'home',
    ['food', 'meal', 'restaurant'],
    ['comida', 'comer', 'restaurante'],
  ),
  icon(
    'users',
    Users,
    'relationships',
    ['friends', 'social', 'team'],
    ['amigos', 'social', 'equipo'],
  ),
  icon(
    'walletCards',
    WalletCards,
    'finance',
    ['wallet', 'cards', 'payments'],
    ['cartera', 'tarjetas', 'pagos'],
  ),
  icon('waves', Waves, 'leisure', ['water', 'swim', 'calm'], ['agua', 'nadar', 'calma']),
  icon(
    'wrench',
    Wrench,
    'home',
    ['repair', 'maintenance', 'tools'],
    ['reparar', 'mantenimiento', 'herramientas'],
  ),
] as const satisfies readonly CategoryIconDefinition[]

export const CATEGORY_ICON_REGISTRY = Object.fromEntries(
  CATEGORY_ICON_DEFINITIONS.map((definition) => [definition.key, definition.component]),
) as Record<CategoryIconKey, LucideIcon>

export const CATEGORY_ICON_FALLBACK_KEY: CategoryIconKey = 'general'

export const getCategoryIconDefinition = (key: string) => {
  return (
    CATEGORY_ICON_DEFINITIONS.find((definition) => definition.key === key) ??
    CATEGORY_ICON_DEFINITIONS.find((definition) => definition.key === CATEGORY_ICON_FALLBACK_KEY)
  )
}

export const getCategoryIconComponent = (key: string) => {
  return CATEGORY_ICON_REGISTRY[key as CategoryIconKey] ?? CATEGORY_ICON_REGISTRY.general
}

export const searchCategoryIconDefinitions = (query: string, locale: string) => {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return [...CATEGORY_ICON_DEFINITIONS]
  }

  return CATEGORY_ICON_DEFINITIONS.filter((definition) => {
    const words = [
      definition.key,
      ...definition.keywords.en,
      ...definition.keywords.es,
      ...(locale.startsWith('es') ? definition.keywords.es : definition.keywords.en),
    ]

    return words.some((word) => word.toLowerCase().includes(normalizedQuery))
  })
}
