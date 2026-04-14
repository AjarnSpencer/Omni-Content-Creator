export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
}

export const getDimensions = (ratio: AspectRatio): { width: number; height: number } => {
  switch (ratio) {
    case AspectRatio.SQUARE: return { width: 2400, height: 2400 };
    case AspectRatio.LANDSCAPE_4_3: return { width: 2400, height: 1800 };
    case AspectRatio.PORTRAIT_3_4: return { width: 1800, height: 2400 };
    case AspectRatio.LANDSCAPE_16_9: return { width: 2400, height: 1350 };
    case AspectRatio.PORTRAIT_9_16: return { width: 1350, height: 2400 };
    default: return { width: 1800, height: 2400 };
  }
};

export enum ArtStyle {
  RATTANAKOSIN = 'RATTANAKOSIN',
  TIBETAN = 'TIBETAN',
  ZEN = 'ZEN',
  VEDIC = 'VEDIC',
  DVARAMATI = 'DVARAMATI',
  SRIVIJAYA = 'SRIVIJAYA',
  LOPBURI = 'LOPBURI',
  UTONG = 'UTONG',
  CHIANGSAEN = 'CHIANGSAEN',
  SUKHOTHAI = 'SUKHOTHAI',
  AYUTTHAYA = 'AYUTTHAYA',
  LANNA = 'LANNA',
  BAYON = 'BAYON',
  BALINESE = 'BALINESE',
  JAIN = 'JAIN',
  SHAIVA = 'SHAIVA',
  PATAN = 'PATAN',
  GANDHARA = 'GANDHARA',
  MATHURA = 'MATHURA',
  CHENNAI = 'CHENNAI',
  SUFI = 'SUFI',
  ZOROASTRIAN = 'ZOROASTRIAN',
  EGYPTIAN = 'EGYPTIAN',
  MAYA = 'MAYA',
  INCA = 'INCA',
  OLMEC = 'OLMEC',
  AZTEC = 'AZTEC',
  INUIT = 'INUIT',
  SUOMI = 'SUOMI',
  CELTIC = 'CELTIC',
  // Islamic Styles
  ISLAMIC_MOORISH = 'ISLAMIC_MOORISH',
  ISLAMIC_PERSIAN_MINIATURE = 'ISLAMIC_PERSIAN_MINIATURE',
  ISLAMIC_OTTOMAN = 'ISLAMIC_OTTOMAN',
  // Western Esoteric / Hermetic
  HERMETIC_ALCHEMY = 'HERMETIC_ALCHEMY',
  ROSICRUCIAN = 'ROSICRUCIAN',
  MASONIC_TRACING_BOARD = 'MASONIC_TRACING_BOARD',
  SOLOMONIC_PENTACLE = 'SOLOMONIC_PENTACLE',
  // Modern
  MODERN_MINIMALIST = 'MODERN_MINIMALIST',
  NEO_VISUAL_GEOMETRY = 'NEO_VISUAL_GEOMETRY',
  CONTEMPORARY_LINE_ART = 'CONTEMPORARY_LINE_ART',
  NEOLITHIC_ART = 'NEOLITHIC_ART',
  GEOGLYPH_ART = 'GEOGLYPH_ART',
  MEDIEVAL_ART = 'MEDIEVAL_ART',
  RENAISSANCE_ART = 'RENAISSANCE_ART',
  ART_NOUVEAU = 'ART_NOUVEAU',
  // New Styles
  PAPER_ART = 'PAPER_ART',
  WATERCOLOR = 'WATERCOLOR',
  CUBIST = 'CUBIST',
  IMPRESSIONIST = 'IMPRESSIONIST',
  SCULPTURE = 'SCULPTURE',
  CLAYMATION = 'CLAYMATION',
  ILLUSTRATOR = 'ILLUSTRATOR',
  COMIC_STRIP = 'COMIC_STRIP',
  SKETCH = 'SKETCH',
  ICONIC = 'ICONIC',
  KEN_BURNS_STORYTELLER = 'KEN_BURNS_STORYTELLER',
  TECHNICAL_ILLUSTRATOR = 'TECHNICAL_ILLUSTRATOR',
  PROFESSIONAL_PHOTO = 'PROFESSIONAL_PHOTO',
  HISTORICAL_DOCUMENTARY = 'HISTORICAL_DOCUMENTARY',
  MANGA = 'MANGA',
  VECTOR_ART = 'VECTOR_ART',
  HACKER_MATRIX = 'HACKER_MATRIX',
  PSYCHEDELIC = 'PSYCHEDELIC',
  BOTANICAL_SCIENTIFIC = 'BOTANICAL_SCIENTIFIC',
  POSTER_ART = 'POSTER_ART',
  ASTRONOMICAL_CINEMATIC = 'ASTRONOMICAL_CINEMATIC',
  FANTASY = 'FANTASY',
  SCI_FI = 'SCI_FI',
  ESCHER_PERSPECTIVE = 'ESCHER_PERSPECTIVE',
  PIXEL_ART = 'PIXEL_ART',
  FRACTAL_ART = 'FRACTAL_ART',
  DIGITAL_COLLAGE = 'DIGITAL_COLLAGE',
  UKIYO_E = 'UKIYO_E',
  SYNTHWAVE = 'SYNTHWAVE',
  GLITCH_ART = 'GLITCH_ART',
  STAINED_GLASS = 'STAINED_GLASS',
  MINIATURE_DIORAMA = 'MINIATURE_DIORAMA',
  CHARCOAL_RENAISSANCE = 'CHARCOAL_RENAISSANCE',
  AFRICAN_TRADITIONAL = 'AFRICAN_TRADITIONAL',
  HISTORICAL_BIBLICAL = 'HISTORICAL_BIBLICAL',
  NORDIC_RUNIC_PHOTOGRAPHY = 'NORDIC_RUNIC_PHOTOGRAPHY',
  RUSSIAN_CONSTRUCTIVIST = 'RUSSIAN_CONSTRUCTIVIST',
  RUSSIAN_FOLK_ART = 'RUSSIAN_FOLK_ART',
  JAPANESE_IREZUMI = 'JAPANESE_IREZUMI',
  POLYNESIAN_TATAU = 'POLYNESIAN_TATAU',
  MANGA_MODERN = 'MANGA_MODERN',
  STEAMPUNK_VICTORIAN = 'STEAMPUNK_VICTORIAN',
}

export enum GenerationMode {
  STUDIO = 'STUDIO',
  NARRATIVE = 'NARRATIVE',
}

export enum VoiceType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum ScriptType {
  AMHARIC = 'Amharic (Ethiopic)',
  ARABIC = 'Arabic',
  ARAMAIC = 'Aramaic',
  ARMENIAN = 'Armenian',
  BALINESE_SCRIPT = 'Balinese Script',
  BENGALI = 'Bengali',
  BULGARIAN = 'Bulgarian',
  BURMESE = 'Burmese',
  CHINESE_SIMPLIFIED = 'Chinese (Simplified)',
  CHINESE_TRADITIONAL = 'Chinese (Traditional)',
  COPTIC = 'Coptic',
  DANISH = 'Danish',
  DUTCH = 'Dutch',
  ENGLISH = 'English',
  FINNISH = 'Finnish',
  FRENCH = 'French',
  GEORGIAN = 'Georgian',
  GERMAN = 'German',
  GREEK = 'Greek',
  GUJARATI = 'Gujarati',
  GURMUKHI = 'Gurmukhi (Punjabi)',
  HEBREW = 'Hebrew (Biblical)',
  HINDI = 'Hindi',
  INDONESIAN = 'Indonesian',
  ITALIAN = 'Italian',
  JAPANESE = 'Japanese',
  JAVANESE = 'Javanese Script',
  KANNADA = 'Kannada',
  KHOM = 'Khom (Khmer Script)',
  KOREAN = 'Korean',
  LANNA = 'Lanna (Tai Tham)',
  LAO = 'Lao',
  LATIN = 'Latin',
  MALAY = 'Malay',
  MALAYALAM = 'Malayalam',
  MONGOLIAN = 'Mongolian Script',
  NORWEGIAN = 'Norwegian',
  PALI_BURMESE = 'Pali (Burmese Script)',
  PALI_ROMAN = 'Pali (Romanized)',
  PALI_SINHALA = 'Pali (Sinhala Script)',
  PALI_THAI = 'Pali (Thai Script)',
  PERSIAN = 'Persian (Farsi)',
  POLISH = 'Polish',
  PORTUGUESE = 'Portuguese',
  ROMANIAN = 'Romanian',
  RUSSIAN = 'Russian',
  SANSKRIT = 'Sanskrit (Devanagari)',
  SINHALA = 'Sinhala',
  SPANISH = 'Spanish',
  SWAHILI = 'Swahili',
  SWEDISH = 'Swedish',
  SYRIAC = 'Syriac',
  TAGALOG = 'Tagalog',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  THAI = 'Thai (Modern)',
  TIBETAN = 'Tibetan',
  TURKISH = 'Turkish',
  URDU = 'Urdu',
  VIETNAMESE = 'Vietnamese',
}

export enum AgentType {
  VISION = 'Visionary',
  STORYTELLER = 'Storyteller',
  PALI_SCHOLAR = 'Scholar',
  RESEARCHER = 'Researcher',
  ROYAL_CRAFTSMAN = 'Craftsman',
  ICONOGRAPHER = 'Iconographer',
  COMPOSITOR = 'Compositor',
  ARTISAN = 'Artisan',
  ARCHITECT = 'Architect',
  CALLIGRAPHER = 'Calligrapher',
  SPELLCHECKER = 'Proofreader',
  ABBOT = 'Director',
}

export interface AgentStatus {
  id: AgentType;
  name: string;
  role: string;
  status: 'idle' | 'active' | 'completed' | 'waiting';
  log: string[];
}

export interface DiagramData {
  svg: string;
  backgroundUrl?: string; // Base64 or URL
  description: string;
  title: string;
  contextTitle?: string; // Translated "Dhammic Context" header
  scriptType?: ScriptType;
  story_text?: string;
  final_humanized_output?: string;
  audioUrl?: string;
  audioBlob?: Blob;
  mp3Url?: string;
  mp3Blob?: Blob;
  videoUrl?: string;
  videoBlob?: Blob;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Attachment {
  type: 'image' | 'text' | 'pdf';
  mimeType: string;
  data: string;
}
