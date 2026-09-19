
import { GoogleGenAI, Type, GenerateContentResponse, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ArtStyle, ScriptType, AspectRatio, getDimensions, DiagramData, Attachment, VoiceType } from '../types';

const API_KEY_STORAGE_KEY = 'omni_content_api_key';

export const getStoredApiKey = () => localStorage.getItem(API_KEY_STORAGE_KEY);
export const setStoredApiKey = (key: string) => localStorage.setItem(API_KEY_STORAGE_KEY, key);
export const removeStoredApiKey = () => localStorage.removeItem(API_KEY_STORAGE_KEY);

const TTS_MODEL_STORAGE_KEY = 'gemini_tts_model_name';
export const getStoredTtsModel = () => localStorage.getItem(TTS_MODEL_STORAGE_KEY) || 'gemini-3.1-flash-tts-preview';
export const setStoredTtsModel = (model: string) => localStorage.setItem(TTS_MODEL_STORAGE_KEY, model);

const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';
const TEXT_MODEL_STORAGE_KEY = 'gemini_text_model_name';
export const getStoredTextModel = () => localStorage.getItem(TEXT_MODEL_STORAGE_KEY) || DEFAULT_TEXT_MODEL;
export const setStoredTextModel = (model: string) => localStorage.setItem(TEXT_MODEL_STORAGE_KEY, model);


const getAiClient = () => {
  // Prefer the manually stored key if the user provided one.
  // Otherwise, fallback to the platform-injected API key.
  const apiKey = getStoredApiKey() || (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  if (!apiKey) {
    // We'll handle the UI prompt in the component, but we still need to throw here if called without a key
    throw new Error("API_KEY_REQUIRED");
  }
  return new GoogleGenAI({ apiKey });
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isTransient = 
      error.status === 502 ||
      error.status === 503 || 
      error.status === 429 || 
      error.message?.includes('502') ||
      error.message?.includes('503') || 
      error.message?.includes('429') ||
      error.message?.includes('high demand') ||
      error.message?.includes('UNAVAILABLE') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('Resource has been exhausted') ||
      error.message?.includes('rate limit') ||
      error.message?.includes('Too Many Requests') ||
      error.message?.includes('Quota exceeded');

    if (retries > 0 && isTransient) {
      // Add jitter to delay (longer base delay for rate limits)
      const baseDelay = error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') ? Math.max(delay, 3000) : delay;
      const jitter = Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
      return withRetry(fn, retries - 1, baseDelay * 1.5);
    }
    
    if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
      throw new Error(`Access Forbidden (403). This usually means your API Key is restricted, has insufficient permissions for this model, or your region is not supported. Original error: ${error.message}`);
    }

    throw error;
  }
};

const getScriptInstructions = (script: ScriptType): string => {
  switch (script) {
    case ScriptType.AMHARIC: return "Amharic (using Ethiopic script)";
    case ScriptType.ARABIC: return "Arabic";
    case ScriptType.ARAMAIC: return "Aramaic (using Imperial Aramaic or Syriac script)";
    case ScriptType.ARMENIAN: return "Armenian (using Armenian script)";
    case ScriptType.BALINESE_SCRIPT: return "Balinese (using traditional Balinese script)";
    case ScriptType.BENGALI: return "Bengali (using Bengali script)";
    case ScriptType.BURMESE: return "Burmese";
    case ScriptType.CHINESE_SIMPLIFIED: return "Chinese (Simplified)";
    case ScriptType.CHINESE_TRADITIONAL: return "Chinese (Traditional)";
    case ScriptType.COPTIC: return "Coptic (using Coptic script)";
    case ScriptType.GEORGIAN: return "Georgian (using Georgian script)";
    case ScriptType.GREEK: return "Greek";
    case ScriptType.GUJARATI: return "Gujarati (using Gujarati script)";
    case ScriptType.GURMUKHI: return "Gurmukhi (using Gurmukhi script for Punjabi)";
    case ScriptType.HEBREW: return "Hebrew (Biblical)";
    case ScriptType.HINDI: return "Hindi (using Devanagari script)";
    case ScriptType.ITALIAN: return "Italian";
    case ScriptType.JAPANESE: return "Japanese";
    case ScriptType.JAVANESE: return "Javanese (using traditional Javanese script)";
    case ScriptType.KANNADA: return "Kannada (using Kannada script)";
    case ScriptType.KHOM: return "Pali in Khmer Script (Khom)";
    case ScriptType.KOREAN: return "Korean";
    case ScriptType.LANNA: return "Lanna (Tai Tham script)";
    case ScriptType.LAO: return "Lao (Native Vientiane style. Use authentic Lao vocabulary like 'เว้า' instead of 'พูด', 'เบิ่ง' instead of 'ดู', 'ฮัก' instead of 'รัก'. Avoid Thai sentence particles like 'ครับ/ค่ะ'; use native Lao particles like 'ເດີ້' (der), 'ນໍ' (no), or 'ຈະ' (cha) correctly. Ensure the syntax follows native Lao idioms rather than Central Thai grammar translated into Lao script.)";
    case ScriptType.LATIN: return "Latin";
    case ScriptType.MALAYALAM: return "Malayalam (using Malayalam script)";
    case ScriptType.MONGOLIAN: return "Traditional Mongolian script (vertical)";
    case ScriptType.PALI_BURMESE: return "Pali in Burmese Script";
    case ScriptType.PALI_ROMAN: return "Pali (Romanized)";
    case ScriptType.PALI_SINHALA: return "Pali in Sinhala Script";
    case ScriptType.PALI_THAI: return "Pali in Thai Script (Traditional Phinthu/Nikhahit style)";
    case ScriptType.PERSIAN: return "Persian (Farsi) using Arabic-Persian script";
    case ScriptType.RUSSIAN: return "Russian";
    case ScriptType.SANSKRIT: return "Sanskrit (using Devanagari script)";
    case ScriptType.SINHALA: return "Sinhala";
    case ScriptType.SYRIAC: return "Syriac";
    case ScriptType.TAMIL: return "Tamil (using Tamil script)";
    case ScriptType.TELUGU: return "Telugu (using Telugu script)";
    case ScriptType.THAI: return "Thai (Modern)";
    case ScriptType.TIBETAN: return "Tibetan (using Tibetan script)";
    case ScriptType.URDU: return "Urdu (using Arabic-Urdu script)";
    default: return script;
  }
};

export const generateBackgroundArt = async (prompt: string, style: ArtStyle, ratio: AspectRatio): Promise<string | undefined> => {
  const ai = getAiClient();
  // Falling back to gemini-2.5-flash-image for stable image generation
  const model = 'gemini-2.5-flash-image';
  
  console.log(`[Artisan] Manifesting background for style: ${style} with prompt: ${prompt}`);

  const ancientStyleDirectives = "CRITICAL: NO MODERN TECHNOLOGY. NO COMPUTERS. NO PHONES. NO MODERN PHOTOGRAPHY. NO REALISTIC HUMAN EYES. MUST BE TRADITIONAL ART ONLY.";
  
  let stylePrompt = "";
  switch (style) {
    case ArtStyle.RATTANAKOSIN:
      stylePrompt = `Museum-grade ultra-high-resolution masterpiece of ancient Thai Buddhist Rattanakosin fine art (Jittrakarn Thai). 
          Aesthetics: Deep temple vermillion, forest green, and rich heavy gold leaf. Visual lotus motifs and celestial cloud patterns.
          Style: Pristine, freshly painted masterpiece. Flawless condition. Includes an intricate Thai Lai Kranok decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.TIBETAN:
      stylePrompt = `High-fidelity Tibetan Vajrayana Thangka fine art painting. 
          Aesthetics: Vibrant mineral pigments (lapis lazuli blue, malachite green, cinnabar red), fine gold line work. 
          Subject: Visual mandalas, peaceful and wrathful deities, Himalayan landscape. 
          Style: Intricate silk brocade framing, traditional scroll texture. Pristine condition.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.ZEN:
      stylePrompt = `Masterpiece Japanese Zen Buddhist Sumi-e ink wash painting. 
          Aesthetics: Minimalist, high-contrast black ink on fresh washi paper. 
          Subject: Enso circles, bamboo, misty mountains, or rock gardens. 
          Style: Spontaneous brushstrokes, significant negative space (Ma), wabi-sabi aesthetic. Traditional Japanese mounting frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.VEDIC:
      stylePrompt = `Ancient Hindu Brahmanic Vedic fine art masterpiece. 
          Aesthetics: Saffron, turmeric yellow, and deep vermillion mineral pigments. 
          Subject: Visual Yantras, celestial chariots (Vimanas), Vedic deities (Agni, Indra, Surya), and Devanagari motifs. 
          Style: Traditional Pata-chitra painting or classical Indian miniature style. Pristine, vibrant colors. Ornate Vedic geometric decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.DVARAMATI:
      stylePrompt = `Museum-grade ultra-high-resolution Dvaravati (6th-11th c.) Buddhist fine art panel. 
          Aesthetics: Earthy terracotta, muted sandstone, and subtle lapis accents; delicate gilded borders. 
          Subject: Early Jataka scenes, stylised bodhisattvas in flowing drapery, lotus-petal mandalas. 
          Style: Smooth, intact surface. Flawless execution. Decorative Mon-Dvaravati style frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.SRIVIJAYA:
      stylePrompt = `High-resolution Srivijaya (8th-13th c.) maritime-Buddhist fine art painting. 
          Aesthetics: Deep indigo, sea-foam green, and burnished gold; wave-like cloud motifs. 
          Subject: Avalokiteśvara on a nāga-boat, marine creatures, Borobudur-inspired lotus crowns. 
          Style: Smooth surface with subtle varnish sheen. Pristine condition. Decorative Srivijayan maritime gold frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.LOPBURI:
      stylePrompt = `Museum-grade ultra-high-resolution Lopburi (10th-13th c.) Buddhist fine art painting. 
          Aesthetics: Burnt umber, oxidised copper, and vibrant vermillion; interlaced with Sanskrit-Khmer decorative bands. 
          Subject: Sukhothai-style Phra Phuttha Chinnarat in profile, surrounded by Khmer-inspired naga railings and elephant processions. 
          Style: Smooth, polished surface. Intact and vibrant. Khmer-style carved decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.UTONG:
      stylePrompt = `Ultra-high-resolution U-Thong (13th-14th c.) Buddhist fine art composition. 
          Aesthetics: Warm ochre, deep teal, and gilt-leaf borders; stylised cloud ribbons. 
          Subject: Narrative of the Buddha’s first sermon, flanked by early Thai deities in traditional hill-tribe attire. 
          Style: Polished surface, faintly polished with a faint lacquer finish. Pristine. Early Thai decorative gold frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.CHIANGSAEN:
      stylePrompt = `Museum-grade Chiang Saen (13th-15th c.) Buddhist fine art painting. 
          Aesthetics: Soft jade-green, muted indigo, and aged gold; intricate interlocking "Lanna" floral scrolls. 
          Subject: Stupas, the "Three Jewels" iconography, and a stylised Phra Ong Dam (the "Grey Buddha") rendered in linear perspective. 
          Style: Fine-grained surface. Flawless condition. Lanna-style floral decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.SUKHOTHAI:
      stylePrompt = `High-resolution Sukhothai (13th-15th c.) Buddhist fine art masterpiece. 
          Aesthetics: Brilliant vermilion, golden ochre, sea-green, and luminous pearl-white; radiant halo detailing. 
          Subject: Elegant "Walking Buddha" (Phra Phuttha Chinna) in graceful, flowing robes, surrounded by lotus-petal mandalas, celestial bodies. 
          Style: Smooth surface, faintly reflective; subtle brush-stroke texture. Pristine. Elegant Sukhothai flame-motif decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.AYUTTHAYA:
      stylePrompt = `Museum-grade ultra-high-resolution Ayutthaya (14th-18th c.) Buddhist fine art panel. 
          Aesthetics: Deep indigo, rust-red, metallic gold, and ivory; elaborate "pichai" cloud-and-flame borders. 
          Subject: Composite scene of the Buddha’s "Parinirvana" together with royal patronage and Siamese guardian deities. 
          Style: Smooth, polished surface with a rich lacquer veneer; incorporates gold-leaf inlay. Flawless condition. Elaborate Ayutthaya gold-leaf decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.BALINESE:
      stylePrompt = `Museum-grade ultra-high-resolution Balinese Hindu-Buddhist fine art painting (19th c. "Kamasan" style). 
          Aesthetics: Saturated indigo, vermilion, natural earth tones, and polished gold leaf; intricate "candi" border patterns. 
          Subject: Wayang-style epic panels merged with Buddhist Jataka narratives; stylised deities with exaggerated facial features, lotus-petal halos, and Barong-type guardians. 
          Style: Highly polished surface with a subtle lacquer finish. Pristine. Traditional Balinese carved wood style decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.JAIN:
      stylePrompt = `Museum-grade ultra-high-resolution Jain fine art painting (10th-12th c. Gujarat). 
          Aesthetics: Soft ivory, muted saffron, deep lapis, and fine silver-ink highlights; graceful floral vines. 
          Subject: Tirthankaras in meditative lotus posture, surrounded by intricate "Sanjivani" yantras, celestial animals. 
          Style: Fine surface with delicate texture; subtle embossing of "Kalasha" motifs. Intact. Ornate Gujarati manuscript style decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.SHAIVA:
      stylePrompt = `High-resolution Shaiva fine art painting (12th-13th c. South-Indian Chola style). 
          Aesthetics: Burnt orange, deep teal, gold-leaf, and "Kumkum" red; dynamic swirling cloud bands. 
          Subject: Nataraja (Dancing Shiva) amidst a pantheon of Ganesha, Parvati, and the "Dvarapalas"; intricate "kala-cart" ornamentation. 
          Style: Smooth surface with a faint fresco-glaze sheen, typical of Chola court artisans. Pristine. Chola bronze and gold style decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.PATAN:
      stylePrompt = `Museum-grade ultra-high-resolution Patan (Lalitpur) Newar Buddhist thangka-style fine art painting (15th c. Nepal). 
          Aesthetics: Rich vermilion, jade-green, saffron, and platinum-silver leaf; delicate "Mandalic" border filigree. 
          Subject: Multi-panel narrative of Shakyamuni’s life, surrounded by deer, and celestial musicians. 
          Style: Smooth surface with a faint "copper-bark" patina. Flawless condition. Nepalese Newari repousse metalwork style decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.GANDHARA:
      stylePrompt = `High-fidelity Gandhara (1st-5th c.) Buddhist fine art painting. 
          Aesthetics: Earthy ochre, smooth sandstone colors, muted turquoise, and delicate gold leaf; Greco-Roman vegetal scrolls. 
          Subject: Real-ist style Buddha in flowing drapery, flanked by Hellenistic winged attendants, stupas. 
          Style: Polished surface. Subtle "stucco-relief" effect that mimics early Greco-Buddhist syncretism. Intact. Greco-Buddhist stucco style decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.MATHURA:
      stylePrompt = `Museum-grade ultra-high-resolution Mathura (1st-3rd c.) Buddhist fine art painting. 
          Aesthetics: Warm ochre, deep crimson, bright indigo, and gold-leaf accents; bold, rounded outlines. 
          Subject: Early anthropomorphic Buddha with lotus-hand mudras, surrounded by yaksha guardians, lion-tiger hybrids, and dharma wheels. 
          Style: Smooth surface. Visible brush-stroke "hatching" that underscores the Indian "detached-figure" tradition. Pristine. Mathura red sandstone style decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.CHENNAI:
      stylePrompt = `High-resolution Chola-period Shaiva–Buddhist fine art painting (12th c. Tamil Nadu). 
          Aesthetics: Terracotta red, lapis blue, brass-gold, and pearl-white; intricate "karnak" border motifs. 
          Subject: Collage of Shiva as "Ardhanarishvara" sharing space with Bodhisattva Avalokiteśvara. 
          Style: Smooth surface with a faint bamboo-brush texture; subtle luster from historic metallic pigment underlayer. Flawless. Dravidian temple architecture style decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.SUFI:
      stylePrompt = `Museum-grade ultra-high-resolution Sufi Islamic fine art.
          Aesthetics: Lapis lazuli blue, turquoise, and brilliant gold leaf; intricate arabesque and visual geometric patterns.
          Subject: Whirling dervishes, celestial spheres, and mystical light.
          Style: Persian miniature or illuminated manuscript style. Pristine condition. Ornate Islamic geometric decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.ZOROASTRIAN:
      stylePrompt = `High-fidelity Zoroastrian Persian fine art.
          Aesthetics: Golden flames, lapis blue, and alabaster white; ancient Achaemenid and Sassanid motifs.
          Subject: The Faravahar, visual fire altars (Ateshgah), and celestial light.
          Style: Ancient Persian bas-relief or illuminated manuscript style. Pristine. Ornate Persian Achaemenid decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.EGYPTIAN:
      stylePrompt = `Museum-grade ultra-high-resolution Ancient Egyptian fine art.
          Aesthetics: Gold leaf, lapis lazuli, turquoise, and carnelian red on papyrus texture.
          Subject: Pharaonic imagery, Anubis, Ra, Eye of Horus, and visual geometry.
          Style: Ancient Egyptian tomb mural or Book of the Dead papyrus style. Pristine, vibrant colors. Ornate Egyptian hieroglyphic decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.MAYA:
      stylePrompt = `High-resolution Ancient Maya fine art masterpiece.
          Aesthetics: Cinnabar red, jade green, and limestone white; intricate Mesoamerican glyphs.
          Subject: Stepped pyramids, celestial serpents, and mythological heroes.
          Style: Classic Maya codex or painted stucco mural style. Pristine condition. Intricate Maya glyph decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.INCA:
      stylePrompt = `Museum-grade ultra-high-resolution Inca Andean fine art.
          Aesthetics: Sun-gold, deep crimson, and earthy terracotta; Chakana (Andean cross) geometry.
          Subject: Inti (Sun God), condors, and megalithic stonework.
          Style: Andean textile (Tocapus) or painted ceramic style. Pristine. Geometric Inca textile decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.OLMEC:
      stylePrompt = `High-fidelity Olmec Mesoamerican fine art.
          Aesthetics: Deep jadeite green, basalt black, and earthy ochre.
          Subject: Were-jaguars, colossal stone heads, and primordial jungle spirits.
          Style: Ancient Mesoamerican polished stone or cave painting style. Pristine. Olmec carved stone decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.AZTEC:
      stylePrompt = `High-resolution Ancient Aztec (Mexica) fine art masterpiece.
          Aesthetics: Turquoise, gold, blood red, and obsidian black; intricate geometric patterns.
          Subject: Quetzalcoatl, Huitzilopochtli, sun stones, and stepped temples.
          Style: Mesoamerican codex (like Codex Borgia) or painted stucco style. Pristine condition. Intricate Aztec geometric decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.INUIT:
      stylePrompt = `Museum-grade Inuit and Arctic indigenous fine art.
          Aesthetics: Bone white, deep ocean blue, and aurora borealis greens/purples.
          Subject: Sedna (sea goddess), polar bears, ravens, and arctic spirits.
          Style: Traditional Inuit printmaking, scrimshaw (bone carving), or stonecut style. Pristine. Minimalist Arctic indigenous decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.SUOMI:
      stylePrompt = `High-resolution Suomi (Finnish/Sami) pagan fine art.
          Aesthetics: Birch bark white, pine green, and deep winter night blue.
          Subject: Kalevala mythology, forest spirits (Tapio), and Sami shamanic drum symbols.
          Style: Nordic folk art or Sami runic drum style. Pristine. Traditional Nordic woodcarving decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.CELTIC:
      stylePrompt = `Museum-grade ultra-high-resolution Celtic fine art.
          Aesthetics: Emerald green, deep crimson, and brilliant gold leaf.
          Subject: Intricate interlaced beasts, Tree of Life, and ancient druidic symbols.
          Style: Insular art, Book of Kells illuminated manuscript style. Pristine. Elaborate Celtic knotwork decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.ISLAMIC_MOORISH:
      stylePrompt = `Museum-grade ultra-high-resolution Moorish Islamic fine art.
          Aesthetics: Lapis lazuli blue, emerald green, terracotta, and brilliant gold leaf.
          Subject: Complex geometric interlacing, zellige tilework, and visual proportions.
          Style: Andalusian/Alhambra architectural tilework or illuminated manuscript style. Pristine condition. Ornate Moorish geometric decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.ISLAMIC_PERSIAN_MINIATURE:
      stylePrompt = `High-fidelity Persian Islamic Miniature fine art.
          Aesthetics: Rich mineral pigments, lapis blue, malachite green, and fine gold line work.
          Subject: Stylized clouds, celestial gardens, and mystical poetry scenes (aniconic or veiled figures).
          Style: Safavid or Herat school miniature painting. Pristine condition. Intricate Persian floral and arabesque decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.ISLAMIC_OTTOMAN:
      stylePrompt = `High-resolution Ottoman Islamic fine art.
          Aesthetics: Cobalt blue, turquoise, and coral red (Iznik colors) with gold leaf.
          Subject: Saz style foliage, tulips, carnations, and sweeping arabesques.
          Style: Iznik ceramic tilework or Ottoman illuminated firman style. Pristine condition. Elegant Ottoman floral decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.HERMETIC_ALCHEMY:
      stylePrompt = `Museum-grade Hermetic Alchemical fine art.
          Aesthetics: Sepia ink, aged parchment tones, and subtle gold or crimson highlights.
          Subject: Alchemical vessels, celestial spheres, the Ouroboros, and the Philosopher's Stone.
          Style: 16th-17th century Renaissance woodcut or copperplate engraving style. Pristine. Elaborate Hermetic symbolic decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.ROSICRUCIAN:
      stylePrompt = `High-fidelity Rosicrucian esoteric fine art.
          Aesthetics: Crimson red, pure white, and gold on dark backgrounds.
          Subject: The Rosy Cross, pelican feeding its young, and mystical light.
          Style: 17th-century esoteric engraving or illuminated manuscript style. Pristine condition. Ornate esoteric symbolic decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.MASONIC_TRACING_BOARD:
      stylePrompt = `High-resolution Masonic Tracing Board fine art.
          Aesthetics: High contrast black and white, royal blue, and gold.
          Subject: Checkerboard floor, pillars of Jachin and Boaz, working tools, and the All-Seeing Eye.
          Style: 18th-19th century classical tracing board painting style. Pristine condition. Neoclassical architectural decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.SOLOMONIC_PENTACLE:
      stylePrompt = `Museum-grade Solomonic Magical Pentacle fine art.
          Aesthetics: Deep parchment, iron gall ink black, and blood red or gold accents.
          Subject: Precise geometric magical seals, concentric circles, and esoteric sigils.
          Style: Clavicula Salomonis (Key of Solomon) grimoire manuscript style. Pristine condition. Concentric geometric and sigil decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.MODERN_MINIMALIST:
      stylePrompt = `High-resolution Modern Minimalist Visual art.
          Aesthetics: Monochromatic or subtle duotone, high contrast, immense negative space.
          Subject: Abstract conceptual themes, pure geometry, and light.
          Style: Contemporary minimalist vector art or Swiss design style, deeply aesthetic. Pristine condition. Clean, thin, elegant minimalist frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.NEO_VISUAL_GEOMETRY:
      stylePrompt = `High-fidelity Neo-Visual Geometry fine art.
          Aesthetics: Glowing neon lines (gold, cyan, or magenta) against a deep void/black background.
          Subject: Metatron's Cube, Seed of Life, complex overlapping mandalas, and quantum conceptual themes.
          Style: Modern digital visionary art, luminous and precise. Pristine condition. Glowing geometric decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.CONTEMPORARY_LINE_ART:
      stylePrompt = `High-resolution Contemporary Visual Line Art.
          Aesthetics: Elegant, continuous fine lines, minimalist palette (gold on black or black on cream).
          Subject: Visual symbols, ethereal figures, and geometric patterns.
          Style: Modern minimalist line art, sophisticated and aesthetic. Pristine condition. Elegant minimalist decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.NEOLITHIC_ART:
      stylePrompt = `Museum-grade ultra-high-resolution Neolithic parietal cave art (Lascaux/Chauvet style). 
          Aesthetics: Red ochre, black charcoal, and earthy pigments on rough limestone. 
          Subject: Herds of bison, horses, cave lions, and shamanic hand stencils. 
          Style: Primitive but powerful figurative art, utilizing natural rock contours for 3D volume. Pristine condition. Ornate stone-carved decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.GEOGLYPH_ART:
      stylePrompt = `High-resolution terrestrial geoglyph art (Nazca/Uffington style). 
          Aesthetics: Earthy desert tones, white chalk lines, and aerial perspective. 
          Subject: Giant hummingbirds, spiders, or white horses etched into the landscape. 
          Style: Monumental land art, astronomical and ritual significance. Pristine condition. Ornate landscape-motif decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.MEDIEVAL_ART:
      stylePrompt = `Museum-grade Medieval European fine art. 
          Aesthetics: Gold leaf, lapis lazuli, and vibrant tempera on vellum. 
          Subject: Illuminated manuscripts, Gothic cathedral architecture, and Byzantine mosaics. 
          Style: High-medieval religious iconography, intricate marginalia, and flat but symbolic perspective. Pristine. Ornate Gothic architectural decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.RENAISSANCE_ART:
      stylePrompt = `High-fidelity Italian Renaissance fine art masterpiece. 
          Aesthetics: Chiaroscuro lighting, sfumato blending, and rich oil pigments. 
          Subject: Anatomical realism, linear perspective, and classical themes. 
          Style: High Renaissance fresco or oil panel style (Da Vinci/Raphael/Michelangelo). Pristine condition. Ornate gilded Renaissance decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.ART_NOUVEAU:
      stylePrompt = `High-resolution Art Nouveau (Belle Époque) fine art. 
          Aesthetics: Organic floral lines, whiplash curves, and pastel mineral tones. 
          Subject: Stylized nature, elegant female figures, and intricate patterns. 
          Style: Alphonse Mucha or Antoni Gaudí aesthetic, flowing and decorative. Pristine condition. Ornate Art Nouveau organic decorative frame.
          ${ancientStyleDirectives}`;
      break;
    case ArtStyle.PAPER_ART: 
      stylePrompt = "3D layered papercraft, shadows between cutouts, textured cardstock, vibrant colors, clean edges.";
      break;
    case ArtStyle.WATERCOLOR: 
      stylePrompt = "Soft bleeding edges, wet-on-wet technique, visible paper grain, ethereal translucent washes.";
      break;
    case ArtStyle.CUBIST: 
      stylePrompt = "Fragmented geometric shapes, multiple perspectives shown simultaneously, earthy tones, analytical cubism style.";
      break;
    case ArtStyle.IMPRESSIONIST: 
      stylePrompt = "Short thick brushstrokes, emphasis on light and its changing qualities, dabs of unmixed color, airy movement.";
      break;
    case ArtStyle.SCULPTURE: 
      stylePrompt = "3D physical medium, chiseled marble or cast bronze, studio lighting with dramatic highlights and shadows.";
      break;
    case ArtStyle.CLAYMATION: 
      stylePrompt = "Hand-sculpted plasticine figures, slight thumbprint textures, stop-motion animation aesthetic, tactile 3D feel.";
      break;
    case ArtStyle.ILLUSTRATOR: 
      stylePrompt = "Professional digital editorial illustration, clean lines, balanced composition, modern graphic design feel.";
      break;
    case ArtStyle.COMIC_STRIP: 
      stylePrompt = "Traditional hand-drawn comic book art, halftone dots, bold ink outlines, action lines, vintage newsprint feel.";
      break;
    case ArtStyle.SKETCH: 
      stylePrompt = "Rough graphite or charcoal drawing, cross-hatching, smudged textures, unfinished artistic process look.";
      break;
    case ArtStyle.ICONIC: 
      stylePrompt = "Minimalist, high-contrast, symbolic representation, bold silhouettes, instantly recognizable simplified forms.";
      break;
    case ArtStyle.KEN_BURNS_STORYTELLER: 
      stylePrompt = `A cinematic, context-relevant photographic story-still. Style: Historical documentary archive. 
              Composition: Panned-focus aesthetic, high narrative relevance to: "${prompt}". 
              Atmosphere: Immersive, educational, soulful, authentic archival quality.`;
      break;
    case ArtStyle.TECHNICAL_ILLUSTRATOR: 
      stylePrompt = "Blueprint or patent-style drawing, precise measurements, exploded views, clean technical ink lines on vellum.";
      break;
    case ArtStyle.PROFESSIONAL_PHOTO: 
      stylePrompt = "Professional photography. Settings: 35mm anamorphic lens, f/2.8, high dynamic range. If context is historical, use period-appropriate film grain (Daguerreotype to Kodachrome). If modern, use crisp 8k digital ISO settings.";
      break;
    case ArtStyle.HISTORICAL_DOCUMENTARY: 
      let eraStyle = "vintage film grain";
      if (prompt.includes("ancient") || prompt.includes("BC")) eraStyle = "weathered stone relief and archaeological site photography";
      else if (prompt.includes("1800s")) eraStyle = "daguerreotype, sepia, heavy motion blur, silver plate texture";
      else if (prompt.includes("1940s")) eraStyle = "black and white noir, high contrast, 35mm film, grainy press camera look";
      else if (prompt.includes("1970s")) eraStyle = "faded Technicolor, warm polaroid tones, slight light leaks";
      else if (prompt.includes("Polynesia")) eraStyle = "Archival 19th-century plate photography of Polynesian voyagers, sepia tones, authentic Tatau visible, realistic skin texture";
      else if (prompt.includes("Viking") || prompt.includes("Nordic")) eraStyle = "Cinematic photography of a Nordic burial mound, Elder Futhark inscriptions on a weathered runestone, damp misty atmosphere, 35mm film grain";
      
      stylePrompt = `Authentic ${eraStyle} documentary photography. Subject: ${prompt}. Composition: National Geographic archive style, highly educational and emotionally resonant.`;
      break;
    case ArtStyle.MANGA: 
      stylePrompt = "Classic Japanese Manga style, screentone patterns, expressive linework, high-contrast black and white ink.";
      break;
    case ArtStyle.VECTOR_ART: 
      stylePrompt = "Flat vector graphics, Adobe Illustrator style, perfect geometric curves, no gradients, clean and scalable.";
      break;
    case ArtStyle.HACKER_MATRIX: 
      stylePrompt = "Cyber-noir, hacker aesthetic. Matrix-green digital rain, silhouettes in hoodies, glowing terminal screens, high-tech underground.";
      break;
    case ArtStyle.PSYCHEDELIC: 
      stylePrompt = "1960s hippy surrealism, melting shapes, kaleidoscopic patterns, neon vibrant contrasting colors, hallucinogenic flow.";
      break;
    case ArtStyle.BOTANICAL_SCIENTIFIC: 
      stylePrompt = "19th-century scientific plate, hyper-detailed botanical accuracy, labeled parts, cream-colored parchment background.";
      break;
    case ArtStyle.POSTER_ART: 
      stylePrompt = "Bold graphic poster style, screen-printed look, heavy typography-ready composition, striking visual metaphors.";
      break;
    case ArtStyle.ASTRONOMICAL_CINEMATIC: 
      stylePrompt = "Deep space photography, Hubble/James Webb aesthetic, nebula gas clouds, photorealistic planets, cinematic cosmic scale.";
      break;
    case ArtStyle.FANTASY: 
      stylePrompt = "Epic high-fantasy oil painting, magic-hour lighting, mythical creatures, detailed armor and enchanted landscapes.";
      break;
    case ArtStyle.SCI_FI: 
      stylePrompt = "Futuristic concept art, industrial sci-fi, sleek metals, neon accents, megastructures, cinematic lighting.";
      break;
    case ArtStyle.ESCHER_PERSPECTIVE: 
      stylePrompt = "Impossible architecture, optical illusions, tessellations, paradoxical stairs, woodcut texture, gravity-defying perspectives.";
      break;
    case ArtStyle.PIXEL_ART: 
      stylePrompt = "Retro 16-bit video game aesthetic, visible square pixels, limited color palette, clean dithering, sprite-based character design reminiscent of SNES era.";
      break;
    case ArtStyle.FRACTAL_ART: 
      stylePrompt = "Complex mathematical recursive patterns, Mandelbrot set aesthetics, infinite self-similarity, vibrant psychedelic gradients, hypnotic geometric symmetry.";
      break;
    case ArtStyle.DIGITAL_COLLAGE: 
      stylePrompt = "Mixed media 'cut and paste' aesthetic, surreal juxtapositions of vintage photography, modern textures, newspaper clippings, and hand-drawn elements. High-depth layering.";
      break;
    case ArtStyle.UKIYO_E: 
      stylePrompt = "Traditional Japanese woodblock print style, flat areas of color, bold outlines, 'floating world' perspective, subtle paper texture from the Edo period.";
      break;
    case ArtStyle.SYNTHWAVE: 
      stylePrompt = "1980s retro-futurism. Neon pink and cyan color palette, wireframe grids, glowing suns, chrome textures, and a VHS-filtered cinematic atmosphere.";
      break;
    case ArtStyle.GLITCH_ART: 
      stylePrompt = "Digital distortion aesthetic, datamoshing, color fringing, shifted scanlines, corrupted file textures, and high-contrast digital artifacts.";
      break;
    case ArtStyle.STAINED_GLASS: 
      stylePrompt = "Ecclesiastical gothic style, vibrant translucent colored glass panes held by thick lead cames, light passing through creating colorful refractions.";
      break;
    case ArtStyle.MINIATURE_DIORAMA: 
      stylePrompt = "Tilt-shift photography style, making large scenes look like tiny toys. Shallow depth of field, high saturation, and a macro-lens perspective.";
      break;
    case ArtStyle.CHARCOAL_RENAISSANCE: 
      stylePrompt = "Old master's study. Smudged charcoal and white chalk on toned paper, high chiaroscuro (contrast of light and dark), anatomical precision, 16th-century sketch feel.";
      break;
    case ArtStyle.AFRICAN_TRADITIONAL:
      stylePrompt = "African heritage style. Incorporate bold geometric patterns like Kente and Mudcloth (Bògòlanfini). Features textures of West African bronze sculptures (Benin/Ife style), rich earth tones, ochre, and indigo. Focus on the dignity of the subject with vibrant cultural symbolism.";
      break;
    case ArtStyle.HISTORICAL_BIBLICAL:
      stylePrompt = "Biblical Antiquity style. Cinematic lighting of the Levant; textures of limestone, ancient cedar, and hand-woven linen. Visual tone of a high-budget historical epic. Avoid modern tropes; focus on authentic Second Temple or Bronze Age aesthetics, dusty atmosphere, and golden hour desert light.";
      break;
    case ArtStyle.NORDIC_RUNIC_PHOTOGRAPHY:
      stylePrompt = "Cinematic Nordic aesthetic. Ultra-realistic photography, high contrast, moody 'Blue Hour' lighting. Include strictly accurate Elder Futhark or Younger Futhark runes carved into stone or weathered wood. Zero fantasy hallucinations; focused on historical Norse archaeological accuracy and rugged landscapes.";
      break;
    case ArtStyle.RUSSIAN_CONSTRUCTIVIST:
      stylePrompt = "1920s Russian Constructivism. Bold primary colors (Red, Black, White), heavy geometric shapes, photomontage elements, and aggressive propaganda-style typography layout. High-energy and industrial.";
      break;
    case ArtStyle.RUSSIAN_FOLK_ART:
      stylePrompt = "Traditional Khokhloma and Lubok style. Intricate floral patterns in gold, red, and black on wood texture. Stylized, naive storytelling illustration with a fairy-tale or hagiographic feel.";
      break;
    case ArtStyle.JAPANESE_IREZUMI:
      stylePrompt = "Traditional Japanese Tattoo art. Flowing compositions of 'Gakubori' (background clouds and waves). Featuring high-contrast motifs of Dragons, Koi, or Han'nya masks. Flat but vibrant colors, bold black outlines, following the Ukiyo-e tradition.";
      break;
    case ArtStyle.POLYNESIAN_TATAU:
      stylePrompt = `Polynesian ancestral visual language. High precision in symbols: 
              - Honu (Turtle) for peace/family.
              - Mano Niho (Shark Teeth) for protection.
              - Enata (Human figures) for relationships.
              Contextual variation: If Samoan, use dense geometric Pe'a patterns. If Māori, use deep-carved Tā Moko spirals. If Marquesan, use bold Patutiki geometric symmetry. No random lines; every mark must tell a story of genealogy and courage.`;
      break;
    case ArtStyle.MANGA_MODERN:
      stylePrompt = "Contemporary High-Fidelity Manga. Sharp linework, expressive cinematic 'camera' angles, screentone textures for shading, and high-octane energy. Influence of modern Seinen-style detailed backgrounds.";
      break;
    case ArtStyle.STEAMPUNK_VICTORIAN:
      stylePrompt = "Industrial Steampunk aesthetic. Victorian-era silhouettes combined with brass machinery, copper pipes, glowing pressure gauges, and steam-powered technology. Sepia-toned atmosphere with polished wood and leather textures.";
      break;
    default:
      stylePrompt = `High-quality visual art background. 
          Aesthetics: Calm, aesthetic tones, subtle visual motifs (lotus, dharma wheel, subtle mandala gradients).
          Style: Traditional visual mural or scroll painting aesthetic. Ornate decorative border.
          CRITICAL: NO MODERN ELEMENTS. NO COMPUTERS. NO OFFICE SETTINGS.`;
  }

  const globalArtDirectives = `
  CRITICAL ART REQUIREMENTS:
  1. CONDITION: Pristine, flawless condition. Smooth, intact surface. Vibrant colors.
  2. FORBIDDEN: NO weathered, NO cracked, NO pitted, NO erosion, NO fissures, NO peeling paint, NO damage, NO ruined effects.
  3. FRAMING: The artwork MUST include a beautiful, ornate decorative frame or border around the edges in the respective cultural/national style.
  4. CONTENT: ABSOLUTELY NO TEXT, NO MODERN ALPHABET, NO OVERLAYS.
  5. UNICODE SUPPORT: If the prompt contains specific script characters (Tibetan, Devanagari, Khmer, etc.), ensure the visual elements reflect the aesthetic of those cultures accurately.
  `;

  try {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model,
      contents: {
        parts: [{ 
          text: `${stylePrompt}
          Subject: ${prompt}.
          ${globalArtDirectives}` 
        }]
      },
      config: { 
        imageConfig: { 
          aspectRatio: ratio
        }
      }
    }));

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        console.warn("[Artisan] Safety block detected. Candidates:", JSON.stringify(candidates));
      }
      
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    console.warn("[Artisan] No image data in response. Using high-quality art fallback.");
    const seed = Math.floor(Math.random() * 1000000);
    const { width, height } = getDimensions(ratio);
    return `https://picsum.photos/seed/${seed}/${width}/${height}?blur=1`;
  } catch (e) {
    console.warn("Background generation failed, using fallback:", e);
    const seed = Math.floor(Math.random() * 1000000);
    const { width, height } = getDimensions(ratio);
    return `https://picsum.photos/seed/${seed}/${width}/${height}?blur=1`;
  }
};

export const pcmToWav = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false);
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false);
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false);
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false);
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  // write pcm data efficiently
  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
};

export const pcmToMp3 = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  try {
    const lamejs = (window as any).lamejs;
    if (!lamejs || !lamejs.Mp3Encoder) {
      console.error("lamejs Mp3Encoder is not available on window.");
      throw new Error("lamejs Mp3Encoder is not available");
    }
    const Mp3Encoder = lamejs.Mp3Encoder;
    const mp3encoder = new Mp3Encoder(1, sampleRate, 128);
    
    // Ensure we are using the correct view of the buffer with proper alignment
    // We create a copy of the buffer to avoid alignment issues
    const bufferCopy = pcmData.buffer.slice(pcmData.byteOffset, pcmData.byteOffset + pcmData.length);
    const samples = new Int16Array(bufferCopy);
    const mp3Data = [];
    
    const sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    
    return new Blob(mp3Data, { type: 'audio/mpeg' });
  } catch (err) {
    console.error("Error in pcmToMp3:", err);
    throw err;
  }
};

export const mergeAudioBlobs = async (blobs: Blob[]): Promise<Uint8Array> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffers = await Promise.all(blobs.map(async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }));

  const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
  const sampleRate = audioBuffers[0].sampleRate;
  const numberOfChannels = audioBuffers[0].numberOfChannels;

  const offlineContext = new OfflineAudioContext(numberOfChannels, totalLength, sampleRate);
  let offset = 0;

  audioBuffers.forEach((buffer) => {
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start(offset);
    offset += buffer.duration;
  });

  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert rendered buffer to PCM
  const pcmData = new Int16Array(renderedBuffer.length * renderedBuffer.numberOfChannels);
  for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
    const channelData = renderedBuffer.getChannelData(channel);
    for (let i = 0; i < renderedBuffer.length; i++) {
      // Convert float32 to int16
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[i * renderedBuffer.numberOfChannels + channel] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  }

  return new Uint8Array(pcmData.buffer);
};

export const sanitizeForTTS = (text: string): string => {
  // Remove markdown symbols, HTML entities, and special characters that shouldn't be spoken
  return text
    .replace(/#/g, '') // Remove hashtags
    .replace(/\*/g, '') // Remove asterisks
    .replace(/_/g, '') // Remove underscores
    .replace(/`/g, '') // Remove backticks
    .replace(/~/g, '') // Remove tildes
    .replace(/&[a-z]+;/gi, '') // Remove HTML entities like &nbsp;
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Replace markdown links with just the text
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

export interface VoicePreset {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  baseVoice: string; // Puck, Charon, Kore, Fenrir, Zephyr
  prompt: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'documentary_male',
    name: 'Classic Documentary Narrator (Male)',
    gender: 'MALE',
    baseVoice: 'Charon',
    prompt: `You are a text-to-speech engine. Use a very deep, warm, distinguished mature English MALE voice inspired by classic nature documentaries. The tone must be filled with quiet wonder, supreme intellectual presence, and serene authority. 

PRONUNCIATION STANDARDS: Impeccably pronounce all foreign, historical, and Romanized words (such as Pali terms, Sanskrit, and Thai names) with 100% accuracy on the level of a world-class newsreader or academic researcher. 

CONSTANT PACING MANDATE: Maintain an absolutely steady, unhurried, measured pace from start to finish. Under NO circumstances should you speed up or rush, even at paragraph ends. Introduce peaceful breathing gaps between clauses.`
  },
  {
    id: 'documentary_female',
    name: 'Classic Documentary Narrator (Female)',
    gender: 'FEMALE',
    baseVoice: 'Kore',
    prompt: `You are a text-to-speech engine. Use a warm, rich, elegant mature English FEMALE voice inspired by classical nature documentary narrators. The tone must be serene, deeply holding attention, and filled with quiet reverence and wonder.

PRONUNCIATION STANDARDS: Impeccably pronounce all foreign, historical, and Romanized words (such as Pali terms, Sanskrit, and Thai names) with 100% accuracy on the level of a world-class newsreader or academic researcher. 

CONSTANT PACING MANDATE: Maintain an absolutely steady, unhurried, measured pace from start to finish. Under NO circumstances should you speed up or rush, even at paragraph ends. Introduce peaceful breathing gaps between clauses.`
  },
  {
    id: 'news_male',
    name: 'World-Class Newsreader (Male)',
    gender: 'MALE',
    baseVoice: 'Puck',
    prompt: `You are a text-to-speech engine. Use an articulate, clear, highly professional and objective mature MALE voice, styled like an expert international news broadcaster. The tone must be formal, authoritative, perfectly balanced, and highly clear and readable.

PRONUNCIATION STANDARDS: Impeccably pronounce all foreign, historical, and Romanized words (such as Pali terms, Sanskrit, and Thai names) with 100% accuracy on the level of a world-class newsreader.

CONSTANT PACING MANDATE: Maintain an absolutely steady, perfectly unhurried, and precise rate of speech. Avoid rushing, and maintain clear articulation of every single syllable, with zero sudden changes in speed or rhythm.`
  },
  {
    id: 'news_female',
    name: 'World-Class Newsreader (Female)',
    gender: 'FEMALE',
    baseVoice: 'Kore',
    prompt: `You are a text-to-speech engine. Use an articulate, polished, highly professional and objective mature FEMALE voice, styled like an expert international news broadcaster. The tone must be formal, authoritative, perfectly balanced, clear, and highly focused.

PRONUNCIATION STANDARDS: Impeccably pronounce all foreign, historical, and Romanized words (such as Pali terms, Sanskrit, and Thai names) with 100% accuracy on the level of a world-class newsreader.

CONSTANT PACING MANDATE: Maintain an absolutely steady, perfectly unhurried, and precise rate of speech. Avoid rushing, and maintain clear articulation of every single syllable, with zero sudden changes in speed or rhythm.`
  },
  {
    id: 'sage_male',
    name: 'Mystical Scholar & Sage (Male)',
    gender: 'MALE',
    baseVoice: 'Fenrir',
    prompt: `You are a text-to-speech engine. Use a deeply resonant, ancient, and gravelly mature MALE voice with a reverent, mystical, and contemplative timbre. The tone must sound like an ancient master or spiritual sage speaking from deep silence.

PRONUNCIATION STANDARDS: Impeccably pronounce all sacred, foreign, and Romanized words (such as Pali, Sanskrit, Hebrew, Arabic, and Buddhist terms) with 100% scholarly accuracy.

CONSTANT PACING MANDATE: Maintain an exceptionally slow, rhythmic, meditative, and steady pace from start to finish. Under NO circumstances should you speed up. Provide wide, quiet pauses for contemplation after each sentence.`
  },
  {
    id: 'sage_female',
    name: 'Mystical Scholar & Sage (Female)',
    gender: 'FEMALE',
    baseVoice: 'Zephyr',
    prompt: `You are a text-to-speech engine. Use a serene, ethereal, soft, and warm FEMALE voice with a reverent, peaceful, and mystical quality. The tone must sound like a wise, compassionate spiritual guide or ancient sage.

PRONUNCIATION STANDARDS: Impeccably pronounce all sacred, foreign, and Romanized words (such as Pali, Sanskrit, Hebrew, Arabic, and Buddhist terms) with 100% scholarly accuracy.

CONSTANT PACING MANDATE: Maintain an exceptionally slow, rhythmic, meditative, and steady pace from start to finish. Under NO circumstances should you speed up. Provide wide, quiet pauses for contemplation after each sentence.`
  },
];

/**
 * Splits input text into bite-sized natural chunks for Gemini TTS.
 * Gemini 3.1 Flash TTS has strict candidate audio limits (~30k tokens) and
 * prompt length constraints. Splitting at sentence boundaries prevents
 * "STOP" with empty response and "OTHER" finishReason.
 */
export const chunkTextForTTS = (text: string, maxChunkLength: number = 1800): string[] => {
  const sanitized = sanitizeForTTS(text);
  if (!sanitized) return [];
  if (sanitized.length <= maxChunkLength) return [sanitized];

  const chunks: string[] = [];
  const paragraphs = sanitized.split(/\n+/).map(p => p.trim()).filter(Boolean);

  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + ' ' + para).trim().length <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      if (para.length <= maxChunkLength) {
        currentChunk = para;
      } else {
        // Split paragraph by sentences
        const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [para];
        for (const sentence of sentences) {
          const trimmed = sentence.trim();
          if (!trimmed) continue;

          if ((currentChunk + ' ' + trimmed).trim().length <= maxChunkLength) {
            currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            if (trimmed.length <= maxChunkLength) {
              currentChunk = trimmed;
            } else {
              // Sentence longer than chunk limit: split by commas or clauses
              const clauses = trimmed.split(/(?<=[,;:])\s+/);
              for (const clause of clauses) {
                if ((currentChunk + ' ' + clause).trim().length <= maxChunkLength) {
                  currentChunk = currentChunk ? `${currentChunk} ${clause}` : clause;
                } else {
                  if (currentChunk) chunks.push(currentChunk.trim());
                  if (clause.length > maxChunkLength) {
                    const words = clause.split(/\s+/);
                    let wordChunk = '';
                    for (const w of words) {
                      if ((wordChunk + ' ' + w).trim().length <= maxChunkLength) {
                        wordChunk = wordChunk ? `${wordChunk} ${w}` : w;
                      } else {
                        if (wordChunk) chunks.push(wordChunk.trim());
                        wordChunk = w;
                      }
                    }
                    currentChunk = wordChunk;
                  } else {
                    currentChunk = clause;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk && currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [sanitized];
};

const synthesizeSingleChunk = async (
  ai: GoogleGenAI,
  modelName: string,
  chunkText: string,
  voiceName: string,
  voicePrompt?: string
): Promise<Uint8Array> => {
  let promptText = '';
  if (voicePrompt && voicePrompt.trim()) {
    const cleanVoicePrompt = voicePrompt
      .replace(/<text_to_speak>/gi, '')
      .replace(/<\/text_to_speak>/gi, '')
      .trim();
    promptText = `${cleanVoicePrompt}\n\nRead the following passage:\n"${chunkText}"`;
  } else {
    promptText = `Read the following text aloud clearly, naturally, and at an even pace:\n\n"${chunkText}"`;
  }

  const callModel = async (prompt: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });
  };

  let response = await withRetry(() => callModel(promptText), 3);
  let candidate = response.candidates?.[0];

  // Scan ALL candidate parts for inlineData audio
  let base64Audio: string | undefined;
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        break;
      }
    }
  }

  // If first attempt returned no audio and a custom prompt was used, fallback to minimal prompt
  if (!base64Audio) {
    console.warn("[TTS] Retrying chunk with direct, minimal prompt...");
    const fallbackPrompt = `Read aloud clearly and naturally: "${chunkText}"`;
    response = await withRetry(() => callModel(fallbackPrompt), 2);
    candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          base64Audio = part.inlineData.data;
          break;
        }
      }
    }
  }

  if (!base64Audio) {
    const textResponse = candidate?.content?.parts?.[0]?.text;
    console.error("[TTS] Response missing audio. Text response:", textResponse, "Candidate:", JSON.stringify(candidate, null, 2));
    throw new Error(`No audio generated from Gemini for speech segment. ${textResponse ? 'Model returned text instead of audio.' : ''} Finish reason: ${candidate?.finishReason || 'Unknown'}`);
  }

  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const alignedLength = bytes.length - (bytes.length % 2);
  return bytes.subarray(0, alignedLength);
};

export const generateSpeech = async (
  text: string,
  voiceName: string = 'Charon',
  customVoicePrompt?: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ audioUrl: string; blob: Blob; mp3Blob: Blob; mp3Url: string }> => {
  const ai = getAiClient();
  const modelName = getStoredTtsModel();

  const sanitizedText = sanitizeForTTS(text);
  if (!sanitizedText) {
    throw new Error("Text is empty or contains no readable content for speech.");
  }

  const preset = VOICE_PRESETS.find(p => p.id === voiceName);
  let resolvedVoice = preset ? preset.baseVoice : voiceName;
  
  // Safe normalization of prebuilt voice names supported by Gemini 3.1 Flash TTS
  const VOICE_MAP: Record<string, string> = {
    Aoede: 'Kore',
    aoede: 'Kore',
    charon: 'Charon',
    puck: 'Puck',
    kore: 'Kore',
    fenrir: 'Fenrir',
    zephyr: 'Zephyr'
  };
  if (VOICE_MAP[resolvedVoice]) {
    resolvedVoice = VOICE_MAP[resolvedVoice];
  }
  const VALID_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  if (!VALID_VOICES.includes(resolvedVoice)) {
    resolvedVoice = 'Charon';
  }

  const chunks = chunkTextForTTS(sanitizedText, 1800);
  console.log(`[TTS] Synthesizing speech with voice ${resolvedVoice} across ${chunks.length} segment(s)...`);

  const chunkAudioBuffers: Uint8Array[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (onProgress) {
      onProgress(i + 1, chunks.length);
    }
    console.log(`[TTS] Processing segment ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
    const chunkBytes = await synthesizeSingleChunk(
      ai,
      modelName,
      chunks[i],
      resolvedVoice,
      customVoicePrompt
    );
    chunkAudioBuffers.push(chunkBytes);

    // Delay between segments to respect API pacing
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  // Concatenate chunks with silence padding (200ms = 9600 bytes at 24kHz 16-bit)
  const silenceSamples = 4800; // 200ms at 24000Hz
  const silenceBytesLength = silenceSamples * 2; // 16-bit = 2 bytes/sample
  const silence = new Uint8Array(silenceBytesLength);

  let totalLength = 0;
  for (let i = 0; i < chunkAudioBuffers.length; i++) {
    totalLength += chunkAudioBuffers[i].length;
    if (i < chunkAudioBuffers.length - 1) {
      totalLength += silenceBytesLength;
    }
  }

  const mergedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (let i = 0; i < chunkAudioBuffers.length; i++) {
    mergedBytes.set(chunkAudioBuffers[i], offset);
    offset += chunkAudioBuffers[i].length;
    if (i < chunkAudioBuffers.length - 1) {
      mergedBytes.set(silence, offset);
      offset += silenceBytesLength;
    }
  }

  const wavBlob = pcmToWav(mergedBytes, 24000);
  const wavUrl = URL.createObjectURL(wavBlob);
  
  let mp3Blob = wavBlob; // Fallback to wav if mp3 fails
  let mp3Url = wavUrl;
  try {
    mp3Blob = pcmToMp3(mergedBytes, 24000);
    mp3Url = URL.createObjectURL(mp3Blob);
  } catch (err) {
    console.warn("MP3 encoding failed, falling back to WAV for MP3 download", err);
  }

  return { audioUrl: wavUrl, blob: wavBlob, mp3Blob, mp3Url };
};

export interface SlideContext {
  slideIndex: number;
  totalSlides: number;
  sceneTitle: string;
  act?: string;
  narrativeFocus?: string;
  isFinalSlide: boolean;
  previousSummaries?: string[];
}

export const generateSvgContent = async (
  prompt: string,
  style: ArtStyle,
  script: ScriptType,
  ratio: AspectRatio,
  attachment?: Attachment,
  slideContext?: SlideContext
): Promise<DiagramData> => {
  const ai = getAiClient();
  const modelName = getStoredTextModel();
  let targetFont = 'Inter';
  if (script === ScriptType.THAI || script === ScriptType.PALI_THAI) targetFont = 'Sarabun';
  else if (script === ScriptType.SANSKRIT) targetFont = 'Noto Sans Devanagari, sans-serif';
  else if (script === ScriptType.TIBETAN) targetFont = 'Noto Sans Tibetan, sans-serif';
  else if (script === ScriptType.CHINESE_SIMPLIFIED || script === ScriptType.CHINESE_TRADITIONAL) targetFont = 'Noto Sans SC, sans-serif';
  else if (script === ScriptType.JAPANESE) targetFont = 'Noto Sans JP, sans-serif';
  else if (script === ScriptType.KOREAN) targetFont = 'Noto Sans KR, sans-serif';
  else if (script === ScriptType.ARABIC || script === ScriptType.PERSIAN || script === ScriptType.URDU) targetFont = 'Noto Sans Arabic, sans-serif';
  else if (script === ScriptType.HINDI) targetFont = 'Noto Sans Devanagari, sans-serif';
  else if (script === ScriptType.BENGALI) targetFont = 'Noto Sans Bengali, sans-serif';
  const scriptInstruction = getScriptInstructions(script);
  const { width, height } = getDimensions(ratio);
  const systemInstruction = `
    ROLE AND OBJECTIVE
    Act as the Universal Antiquarian & Storyweaver Engine. The objective is to evaluate user prompts, conduct rigorous historical/theological research, and generate high-quality, literary, and humanized content based on that research.

    DOMAIN EXPERTISE PROFILES
    When analyzing the input, adopt the methodologies of the relevant domains:

    [THEOLOGY & HISTORY]
    - PALI/BUDDHIST: Cross-reference Tipitaka, Agamas.
    - AL QURAN: Cross-reference Quranic text, Tafsir, Sahih Hadith.
    - SUFI: Analyze via Islamic mysticism, Masnavi, esoteric allegory.
    - VEDIC: Consult Shruti and Smriti, distinguishing history from cosmic myth.
    - VIKING/NORSE: Consult Eddas, runic inscriptions, archaeology.
    - CELTIC: Review mythological cycles, Ogham, Romano-British accounts.
    - MEDIEVAL: Decipher chronicles, feudal records.
    - BIBLICAL: Analyze Dead Sea Scrolls, Septuagint, Koine Greek.
    - HEBRAIC: Consult Tanakh, Talmud, Midrash (Halakha vs. Aggadah).
    - MESOAMERICAN: Decipher Nahuatl codices, Olmec glyphs.
    - ANDEAN (INCA): Analyze archaeology, Spanish chronicles, Quipu oral history.

    PIPELINE EXECUTION INSTRUCTIONS
    1. IDENTIFY: Determine the requested domains (e.g., Viking History + Fantasy Writing).
    2. RESEARCH & DRAFT: Establish the factual baseline, then draft the narrative ensuring literary prowess and evocative language.
    3. REFINE: Ensure the final story text flows naturally, maintains strict topic focus, and exhibits high-quality prose.

    CANVAS DIMENSIONS: ${width}x${height}
    ASPECT RATIO: ${ratio}
    
    1. AESTHETICS (FOR SVG CONTAINERS):
       - You MUST adapt the container colors to be visually appealing and readable.
       - Use earthy, neutral, or dark semi-transparent colors (like charcoal, deep brown, or navy) that provide high contrast for the text.

    2. TRANSLATION MANDATE (ABSOLUTE):
       - TARGET LANGUAGE: ${scriptInstruction}.
       - YOUR TASK: You MUST translate ALL output into ${scriptInstruction}.
       - SVG CONTENT: Every single word inside the SVG MUST be ONLY in ${scriptInstruction}.
       - JSON FIELDS: All text fields in the JSON response MUST be fully translated into ${scriptInstruction}.

    3. AESTHETIC LAWS (VISUAL ILLUSTRATION):
       - The SVG MUST start with <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">.
       - The SVG MUST ONLY CONTAIN <g>, <rect>, <text>, and <tspan> tags.
       - DO NOT DRAW ANY ART, ICONS, BORDERS, OR DECORATIVE FLOURISHES. The background image will provide all the visual iconography and art.
       - Your ONLY job is to layout the story_text beautifully over the background image.
       - COMPOSITION RULE: Info-Graphics should be short and simple and not over-cram the canvas.
       - TEXT CONTAINERS: Every text block MUST be inside a semi-transparent (0.45 opacity) rectangle with rx="25" and ry="25".
       - FULL WIDTH MANDATE: All text containers MUST be full width (spanning approximately 90-95% of the canvas width, centered) with consistent padding (top, bottom, left, right).
       - TEXT WRAPPING: Text MUST wrap within its container-background and fill the container width appropriately. Use multiple <tspan> lines to ensure text stays within the rectangle borders.
       - CRITICAL: DO NOT include a full-screen background rectangle. The SVG background MUST be transparent.
       - FONT SIZE: Use LARGE font sizes for readability. Titles should be at least 48px, subheaders 36px, and body text 24px.
       - SPACING: Distribute text containers vertically with enough breathing room. Do not cluster text.

    4. COMPOSITION MASTER:
       - CANVAS SIZE: Use the provided dimensions (${width}x${height}) for your layout.
       - VIEWBOX: Ensure the SVG viewBox is "0 0 ${width} ${height}".
       - TITLE: The main title MUST be centered at the top and very prominent, also within a full-width container.
       - NO OVERLAP: Text containers MUST NOT overlap each other.
       - PADDING: Ensure at least 40px of padding between the text and the edges of the container rectangles.
       - ADAPTABILITY: Distribute text sections across the available canvas space (${width}x${height}) to create a balanced, high-impact infographic composition.

    ${slideContext ? `
    5. MULTI-SLIDE NARRATIVE CONTINUITY & ANTI-REPETITION MANDATE (ABSOLUTE):
       - You are drafting SLIDE ${slideContext.slideIndex + 1} of ${slideContext.totalSlides}: "${slideContext.sceneTitle}" (${slideContext.act || `Act ${slideContext.slideIndex + 1}`}).
       - PREVIOUS SLIDES ALREADY COVERED:
         ${slideContext.previousSummaries && slideContext.previousSummaries.length > 0
           ? slideContext.previousSummaries.map((s, idx) => `[Slide ${idx + 1}]: ${s}`).join('\n         ')
           : 'This is the opening slide (Act 1). Establish the premise and world-building.'}
       - CRITICAL NON-DUPLICATION RULE:
         You are STRICTLY FORBIDDEN from repeating the exposition, opening lines, introductions, or concepts already covered in previous slides.
         DO NOT restart the story from the beginning of the attached document.
         This slide MUST advance the story chronologically forward from where the previous slide left off.
       ${slideContext.isFinalSlide ? `
       - CRITICAL FINAL RESOLUTION MANDATE (CLOSURE & EPILOGUE):
         This is the FINAL SLIDE (${slideContext.slideIndex + 1} of ${slideContext.totalSlides}) - The Climax, Epilogue, and Resolution.
         You MUST deliver the culmination, emotional peak, and definitive closure of the story.
         If the source document lacks an ending, or if the earlier slides consumed all available text: BE BOLD, INVENTIVE, AND CREATIVE. Extrapolate the consequences, resolve the central moral dilemma, and craft a profound, moving philosophical ending. DO NOT repeat the beginning of the story under any circumstances!
       ` : ''}
    ` : ''}

    OUTPUT FORMAT:
    Respond ONLY in valid JSON format. Omit fields that are not relevant to the specific user request.
    The JSON MUST include:
    - title: The main title of the presentation.
    - contextTitle: A translated header for the context section.
    - svg: The high-fidelity SVG code containing the story_text.
    - story_text: The final polished story, narrative, or explanation. This is the ACTUAL CONTENT. Use rich Markdown formatting (headers, bold, italics, bullet points) to make it beautiful and easy to read.
    - description: A short summary of the narrative.
  `;

  let promptText = prompt;
  if (slideContext) {
    promptText = `[NARRATIVE SLIDE ${slideContext.slideIndex + 1} of ${slideContext.totalSlides}]: ${slideContext.sceneTitle} (${slideContext.act || ''})\n` +
      `Focus for this slide: ${slideContext.narrativeFocus || prompt}\n` +
      (slideContext.previousSummaries && slideContext.previousSummaries.length > 0 
        ? `\nPREVIOUS SLIDES ALREADY COVERED (DO NOT REPEAT):\n${slideContext.previousSummaries.join('\n')}\n` +
          `\nREMINDER: Pick up strictly where Slide ${slideContext.slideIndex} left off. Advance the narrative forward without repeating earlier lines.\n` 
        : '') +
      (slideContext.isFinalSlide 
        ? `\nFINAL SLIDE MANDATE: Write the definitive climax, aftermath, and closure of the story. If the source data ended or is incomplete, use your creativity to invent and enhance the ultimate resolution so the story finishes with emotional resonance and finality!\n` 
        : '');
  }

  const contents: any[] = [{ role: 'user', parts: [{ text: promptText }] }];
  if (attachment) {
    if (attachment.type === 'text') {
      const sourceNote = slideContext && slideContext.slideIndex > 0
        ? `Attached Content (Reference Document - note that Slides 1-${slideContext.slideIndex} have already covered the earlier parts of this text; focus strictly on the subsequent chronological section, climax, or resolution):\n`
        : `Attached Content:\n`;
      contents[0].parts.push({ text: `${sourceNote}${attachment.data}` });
    } else {
      contents[0].parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }
  }

  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          contextTitle: { type: Type.STRING },
          svg: { type: Type.STRING },
          story_text: { type: Type.STRING }
        },
        required: ["title", "description", "svg", "contextTitle", "story_text"]
      }
    }
  }));

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);
    
    // Fix literal \n strings if they appear in the story_text
    if (result.story_text && typeof result.story_text === 'string') {
      result.story_text = result.story_text.replace(/\\n/g, '\n');
    }

    // Robust SVG Sanitizer to fix common tag mismatches and malformed XML
    if (result.svg && typeof result.svg === 'string') {
      let sanitized = result.svg;
      
      // 1. Basic string-level fixes for common AI hallucinations
      // Fix <t> tags which are often truncated <tspan> or just AI hallucinations
      sanitized = sanitized.replace(/<t(\s|>)/g, '<tspan$1').replace(/<\/t>/g, '</tspan>');
      
      // Fix nested <text> tags (AI sometimes does <text><text>...</text></text>)
      sanitized = sanitized.replace(/<text([^>]*)>\s*<text([^>]*)>/g, '<text$1>');
      sanitized = sanitized.replace(/<\/text>\s*<\/text>/g, '</text>');

      // 2. Use DOMParser (HTML mode) to fix unclosed tags and structural issues
      // HTML parsers are extremely forgiving and will automatically close tags
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitized, 'text/html');
        const svgElement = doc.querySelector('svg');
        
        if (svgElement) {
          // Ensure it has the correct namespace
          if (!svgElement.hasAttribute('xmlns')) {
            svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          }
          
          // Serialize back to clean XML
          sanitized = new XMLSerializer().serializeToString(svgElement);
        }
      } catch (domError) {
        console.warn("[Architect] DOMParser sanitization failed, falling back to regex:", domError);
        
        // Fallback: regex-based unclosed tag fixer
        sanitized = sanitized.replace(/<tspan([^>]*)>([^<]*?)(?=\s*<(tspan|\/text))/g, (match, p1, p2) => {
          if (p2.includes('</tspan>')) return match;
          return `<tspan${p1}>${p2}</tspan>`;
        });
        
        // Ensure basic XML structure if missing
        if (!sanitized.includes('xmlns="http://www.w3.org/2000/svg"')) {
          sanitized = sanitized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
      }

      // 3. Final cleanup: Remove empty text containers that cause rendering errors
      sanitized = sanitized.replace(/<text[^>]*>\s*(<tspan[^>]*>\s*<\/tspan>)?\s*<\/text>/g, '');
      
      result.svg = sanitized;
    }
    
    return result;
  } catch (parseError) {
    console.error("[Architect] JSON Parse Error:", parseError, "Raw text:", text);
    throw new Error("Failed to parse visual narrative structure.");
  }
};

export const generateDiagram = async (
  prompt: string,
  style: ArtStyle,
  script: ScriptType,
  ratio: AspectRatio,
  attachment?: Attachment
): Promise<DiagramData> => {
  const svgData = await generateSvgContent(prompt, style, script, ratio, attachment);
  const backgroundUrl = await generateBackgroundArt(prompt, style, ratio);
  
  // Small delay to prevent hitting rate limits between sequential calls
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { ...svgData, backgroundUrl, scriptType: script };
};

export const generateSlideDeck = async (
  prompt: string,
  style: ArtStyle,
  script: ScriptType,
  ratio: AspectRatio,
  attachment?: Attachment
): Promise<DiagramData[]> => {
  const ai = getAiClient();
  const planningSystemInstruction = `
    You are the Kathika (Narrative Architect & Master Storyteller).
    TASK: Break down the user's topic or attached document into a sequence of 4 distinct "scenes" or "acts" for a sequential audio-book visual narrative.
    
    CRITICAL 4-ACT NARRATIVE STRUCTURE:
    - Act 1: Exposition & The World. Introduce the core premise, geometry, oracle, protagonist, or setting.
    - Act 2: Rising Tension & Moral Stakes. Deepen the conflict, introduce systemic constraints, dilemmas, or escalating developments.
    - Act 3: Crisis & Turning Point. The maximum confrontation, revelation, realization, or critical choice.
    - Act 4: Climax, Epilogue & Closure. The definitive resolution, emotional aftermath, and final philosophical insight.
    
    STRICT ANTI-REPETITION & SOURCE MATERIAL ALLOCATION MANDATE:
    - You MUST partition the story progression chronologically across all 4 scenes.
    - UNDER NO CIRCUMSTANCES should Scene 4 loop back, rephrase, or repeat the opening premise of Scene 1.
    - If the user provides an attached text or document:
      - Scene 1 covers the beginning exposition.
      - Scene 2 covers the rising tension and development.
      - Scene 3 covers the climax and turning point.
      - Scene 4 covers the conclusion and resolution.
    - If the source document ends early or does NOT contain a conclusion:
      YOU AND THE SCENE SCRIBE ARE EXPLICITLY MANDATED TO BE INVENTIVE AND CREATIVE.
      Synthesize and craft an evocative, profound, and definitive ending for Scene 4. NEVER repeat earlier text because of missing data!
    
    JSON OUTPUT REQUIREMENTS:
    - Output a JSON array of 4 scene definitions.
    - sceneTitle: Concise, evocative title (CRITICAL: DO NOT include "Scene 1", "Slide 1", or any numerical prefixes).
    - act: Label of the narrative phase (e.g., "Act 1: Exposition", "Act 2: Rising Tension", "Act 3: The Crisis", "Act 4: Climax & Resolution").
    - narrativeFocus: Specific storyline developments for this scene (must not overlap with other scenes).
    - visualPrompt: Detailed prompt for traditional/metaphorical visual background art (no modern laptops/phones).
    - contentPrompt: Comprehensive prompt for the narrative writer, explicitly directing them to continue the plot from the prior scene and advance toward the act's objective without repeating earlier material.
  `;

  const contents: any[] = [{ role: 'user', parts: [{ text: `Topic: ${prompt}` }] }];
  if (attachment) {
    if (attachment.type === 'text') {
      contents[0].parts.push({ text: `Attached Content:\n${attachment.data}` });
    } else {
      contents[0].parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }
  }

  const planningResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: getStoredTextModel(),
    contents: contents,
    config: {
      systemInstruction: planningSystemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneTitle: { type: Type.STRING },
            act: { type: Type.STRING },
            narrativeFocus: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            contentPrompt: { type: Type.STRING }
          },
          required: ["sceneTitle", "act", "narrativeFocus", "visualPrompt", "contentPrompt"]
        }
      }
    }
  }));

  const scenes = JSON.parse(planningResponse.text.replace(/```json/g, '').replace(/```/g, '').trim());

  const slides: DiagramData[] = [];
  const previousSummaries: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const isFinalSlide = i === scenes.length - 1;
    console.log(`[Kathika] Manifesting Slide ${i + 1}/${scenes.length}: ${scene.sceneTitle} (${scene.act || ''})`);
    
    const slideContext: SlideContext = {
      slideIndex: i,
      totalSlides: scenes.length,
      sceneTitle: scene.sceneTitle,
      act: scene.act,
      narrativeFocus: scene.narrativeFocus || scene.contentPrompt,
      isFinalSlide,
      previousSummaries: [...previousSummaries]
    };

    try {
      // We generate SVG and Background sequentially to be safe with rate limits and concurrency
      const svgData = await withRetry(() => generateSvgContent(
        `${scene.sceneTitle}. ${scene.contentPrompt}`, 
        style, 
        script, 
        ratio, 
        attachment,
        slideContext
      ), 2);
      
      const backgroundUrl = await generateBackgroundArt(scene.visualPrompt, style, ratio);
      
      // Store summary of this slide to pass as context to subsequent slides
      const slideSummary = `Slide ${i + 1} ("${scene.sceneTitle}"): ${svgData.title}. Events: ${(svgData.description || svgData.story_text || '').slice(0, 300)}...`;
      previousSummaries.push(slideSummary);

      slides.push({ ...svgData, backgroundUrl, scriptType: script });
    } catch (slideError) {
      console.error(`[Kathika] Slide ${i + 1} failed:`, slideError);
      // Push a fallback slide so the deck isn't broken
      slides.push({
        title: scene.sceneTitle,
        description: "Content generation failed for this slide.",
        contextTitle: "Error",
        svg: `<svg width="${getDimensions(ratio).width}" height="${getDimensions(ratio).height}" viewBox="0 0 ${getDimensions(ratio).width} ${getDimensions(ratio).height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a110a"/><text x="50%" y="50%" fill="#d4af37" text-anchor="middle">Slide Generation Failed</text></svg>`,
        story_text: "The Scribe encountered an issue generating this specific slide. Please try again.",
        backgroundUrl: `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22${getDimensions(ratio).width}%22%20height%3D%22${getDimensions(ratio).height}%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231a110a%22%2F%3E%3C%2Fsvg%3E`,
        scriptType: script
      });
    }
    
    // Small delay between slides to prevent hitting rate limits
    if (i < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  return slides;
};
