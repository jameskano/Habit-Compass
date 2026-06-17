export const categoryIconKeys = [
  'activity',
  'award',
  'backpack',
  'banknote',
  'bed',
  'bike',
  'bookOpen',
  'briefcase',
  'brain',
  'brush',
  'calculator',
  'calendar',
  'camera',
  'car',
  'chefHat',
  'chartNoAxesColumn',
  'church',
  'circleHelp',
  'clipboardCheck',
  'clock',
  'coffee',
  'coins',
  'compass',
  'dumbbell',
  'earth',
  'feather',
  'fileText',
  'flower',
  'gamepad',
  'general',
  'gift',
  'globe',
  'graduationCap',
  'handHeart',
  'handshake',
  'heart',
  'heartPulse',
  'home',
  'landmark',
  'languages',
  'laptop',
  'leaf',
  'lightbulb',
  'listChecks',
  'map',
  'medal',
  'messageCircle',
  'mic',
  'moon',
  'mountain',
  'music',
  'newspaper',
  'notebookPen',
  'palette',
  'pawPrint',
  'penLine',
  'plane',
  'plant',
  'presentation',
  'rocket',
  'route',
  'scale',
  'school',
  'send',
  'shield',
  'shirt',
  'shoppingBasket',
  'smile',
  'sparkles',
  'sprout',
  'star',
  'stethoscope',
  'sun',
  'target',
  'tent',
  'treePalm',
  'trophy',
  'uncategorized',
  'utensils',
  'users',
  'walletCards',
  'waves',
  'wrench',
  'personStanding',
] as const

export type CategoryIconKey = (typeof categoryIconKeys)[number]

export const CATEGORY_DEFAULT_CUSTOM_ICON_KEY: CategoryIconKey = 'general'
export const CATEGORY_UNCATEGORIZED_ICON_KEY: CategoryIconKey = 'uncategorized'

export const categoryColorTokens = [
  'tomato',
  'coral',
  'amber',
  'gold',
  'lime',
  'grass',
  'emerald',
  'mint',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'plum',
  'fuchsia',
  'pink',
  'rose',
  'ruby',
  'slate',
  'olive',
  'clay',
  'graphite',
] as const

export type CategoryColorToken = (typeof categoryColorTokens)[number]

export const CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN: CategoryColorToken = 'emerald'

export const CATEGORY_DEFAULTS = [
  {
    defaultKey: 'health',
    name: 'Health',
    nameMessageId: 'category.default.health',
    iconName: 'heartPulse',
    colorToken: 'emerald',
  },
  {
    defaultKey: 'learning',
    name: 'Learning',
    nameMessageId: 'category.default.learning',
    iconName: 'bookOpen',
    colorToken: 'sky',
  },
  {
    defaultKey: 'uncategorized',
    name: 'Uncategorized',
    nameMessageId: 'category.default.uncategorized',
    iconName: CATEGORY_UNCATEGORIZED_ICON_KEY,
    colorToken: 'slate',
  },
] as const satisfies ReadonlyArray<{
  defaultKey: string
  name: string
  nameMessageId: string
  iconName: CategoryIconKey
  colorToken: CategoryColorToken
}>

export type CategoryDefaultKey = (typeof CATEGORY_DEFAULTS)[number]['defaultKey']

export const categoryDefaultKeys = CATEGORY_DEFAULTS.map((category) => category.defaultKey) as [
  CategoryDefaultKey,
  ...CategoryDefaultKey[],
]

export const CATEGORY_DEFAULT_NAME_MESSAGE_IDS = Object.fromEntries(
  CATEGORY_DEFAULTS.map((category) => [category.defaultKey, category.nameMessageId]),
) as Record<CategoryDefaultKey, string>

export const CATEGORY_COLOR_PALETTE: Array<{
  token: CategoryColorToken
  value: string
  labelMessageId: string
}> = [
  { token: 'tomato', value: '#e4533f', labelMessageId: 'category.color.tomato' },
  { token: 'coral', value: '#f26d4d', labelMessageId: 'category.color.coral' },
  { token: 'amber', value: '#d98a16', labelMessageId: 'category.color.amber' },
  { token: 'gold', value: '#c69a17', labelMessageId: 'category.color.gold' },
  { token: 'lime', value: '#8aa12a', labelMessageId: 'category.color.lime' },
  { token: 'grass', value: '#4f9a45', labelMessageId: 'category.color.grass' },
  { token: 'emerald', value: '#24936e', labelMessageId: 'category.color.emerald' },
  { token: 'mint', value: '#2f9f8f', labelMessageId: 'category.color.mint' },
  { token: 'teal', value: '#168c99', labelMessageId: 'category.color.teal' },
  { token: 'cyan', value: '#1688b9', labelMessageId: 'category.color.cyan' },
  { token: 'sky', value: '#2f7fca', labelMessageId: 'category.color.sky' },
  { token: 'blue', value: '#476ec4', labelMessageId: 'category.color.blue' },
  { token: 'indigo', value: '#5b62bd', labelMessageId: 'category.color.indigo' },
  { token: 'violet', value: '#7b5abb', labelMessageId: 'category.color.violet' },
  { token: 'purple', value: '#9553ac', labelMessageId: 'category.color.purple' },
  { token: 'plum', value: '#a44f92', labelMessageId: 'category.color.plum' },
  { token: 'fuchsia', value: '#bd4e8c', labelMessageId: 'category.color.fuchsia' },
  { token: 'pink', value: '#cf5f85', labelMessageId: 'category.color.pink' },
  { token: 'rose', value: '#d95a6f', labelMessageId: 'category.color.rose' },
  { token: 'ruby', value: '#c74a55', labelMessageId: 'category.color.ruby' },
  { token: 'slate', value: '#667085', labelMessageId: 'category.color.slate' },
  { token: 'olive', value: '#70815b', labelMessageId: 'category.color.olive' },
  { token: 'clay', value: '#a56f55', labelMessageId: 'category.color.clay' },
  { token: 'graphite', value: '#52525b', labelMessageId: 'category.color.graphite' },
]
