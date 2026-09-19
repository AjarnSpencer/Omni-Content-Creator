import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  ArtStyle, 
  GenerationMode,
  AgentType, 
  AgentStatus, 
  DiagramData,
  ScriptType,
  AspectRatio,
  Attachment,
  getDimensions
} from './types';
  import { generateDiagram, generateSlideDeck, generateSpeech, getStoredApiKey, setStoredApiKey, removeStoredApiKey, mergeAudioBlobs, pcmToWav, pcmToMp3, VOICE_PRESETS, getStoredTextModel, getStoredTtsModel, setStoredTextModel, setStoredTtsModel } from './services/geminiService';
import { createVideoFromImagesAndAudio } from './services/videoService';
import { AgentBadge } from './components/AgentBadge';
import { DiagramCanvas } from './components/DiagramCanvas';
import { 
  Sparkles, 
  BookOpen, 
  Upload, 
  ScrollText,
  FileText, 
  Image as ImageIcon, 
  X, 
  Play,
  Trash2,
  Languages,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Key,
  LogOut,
  Settings,
  Share2,
  Mic,
  Pause,
  Volume2,
  Video,
  RotateCcw,
  FileImage,
  Loader2,
  Palette,
  Users,
  Info
} from 'lucide-react';

const getLoreDomain = (artStyle: ArtStyle) => {
  switch (artStyle) {
    case ArtStyle.RATTANAKOSIN:
    case ArtStyle.LANNA:
    case ArtStyle.SUKHOTHAI:
    case ArtStyle.AYUTTHAYA:
    case ArtStyle.BAYON:
      return {
        researcherName: 'The Tipitaka Master',
        researchMsg: 'Consulting the Pali Canon (Tipitaka)...',
        scholarName: 'The Pali Scholar',
        translateMsg: (script: string) => `Translating Pali to ${script}...`,
        stylistName: 'The Master Artisan',
        styleMsg: 'Applying traditional Thai/Khmer aesthetics...',
        abbotName: 'The Expert',
        abbotMsg: 'Sadhu.'
      };
    case ArtStyle.ISLAMIC_MOORISH:
    case ArtStyle.ISLAMIC_PERSIAN_MINIATURE:
    case ArtStyle.ISLAMIC_OTTOMAN:
      return {
        researcherName: 'The Quranic Scholar',
        researchMsg: 'Cross-referencing Tafsir and Hadith collections...',
        scholarName: 'The Linguist',
        translateMsg: (script: string) => `Analyzing Classical Arabic roots for ${script}...`,
        stylistName: 'The Master Calligrapher',
        styleMsg: 'Applying Islamic geometric and miniature aesthetics...',
        abbotName: 'The Imam',
        abbotMsg: 'Alhamdulillah.'
      };
    case ArtStyle.HERMETIC_ALCHEMY:
    case ArtStyle.ROSICRUCIAN:
    case ArtStyle.MASONIC_TRACING_BOARD:
    case ArtStyle.SOLOMONIC_PENTACLE:
      return {
        researcherName: 'The Hermetic Adept',
        researchMsg: 'Consulting Grimoires and Alchemical Tracts...',
        scholarName: 'The Philologist',
        translateMsg: (script: string) => `Translating Latin and Hebrew ciphers to ${script}...`,
        stylistName: 'The Visual Geometer',
        styleMsg: 'Applying esoteric and occult symbolism...',
        abbotName: 'The Grand Master',
        abbotMsg: 'So mote it be.'
      };
    case ArtStyle.MODERN_MINIMALIST:
    case ArtStyle.NEO_VISUAL_GEOMETRY:
    case ArtStyle.CONTEMPORARY_LINE_ART:
    case ArtStyle.VECTOR_ART:
    case ArtStyle.ICONIC:
    case ArtStyle.ILLUSTRATOR:
      return {
        researcherName: 'The Modern Expert',
        researchMsg: 'Synthesizing universal conceptual themes...',
        scholarName: 'The Linguist',
        translateMsg: (script: string) => `Translating concepts to ${script}...`,
        stylistName: 'The Minimalist Designer',
        styleMsg: 'Applying clean, modern geometry...',
        abbotName: 'The Curator',
        abbotMsg: 'Approved.'
      };
    case ArtStyle.NEOLITHIC_ART:
    case ArtStyle.GEOGLYPH_ART:
    case ArtStyle.AFRICAN_TRADITIONAL:
    case ArtStyle.POLYNESIAN_TATAU:
      return {
        researcherName: 'The Paleo-Anthropologist',
        researchMsg: 'Analyzing ancient earthworks and indigenous traditions...',
        scholarName: 'The Anthropologist',
        translateMsg: (script: string) => `Interpreting symbols for ${script}...`,
        stylistName: 'The Primitive Artisan',
        styleMsg: 'Applying traditional and earth-pigment aesthetics...',
        abbotName: 'The Elder',
        abbotMsg: 'The ancestors have spoken.'
      };
    case ArtStyle.MEDIEVAL_ART:
    case ArtStyle.RENAISSANCE_ART:
    case ArtStyle.STAINED_GLASS:
    case ArtStyle.CHARCOAL_RENAISSANCE:
      return {
        researcherName: 'The Medievalist',
        researchMsg: 'Consulting illuminated manuscripts and frescoes...',
        scholarName: 'The Latinist',
        translateMsg: (script: string) => `Translating scrolls to ${script}...`,
        stylistName: 'The Master Painter',
        styleMsg: 'Applying classical European aesthetics...',
        abbotName: 'The Bishop',
        abbotMsg: 'Amen.'
      };
    case ArtStyle.ART_NOUVEAU:
    case ArtStyle.WATERCOLOR:
    case ArtStyle.IMPRESSIONIST:
      return {
        researcherName: 'The Art Historian',
        researchMsg: 'Studying organic forms and impressionistic techniques...',
        scholarName: 'The Symbolist',
        translateMsg: (script: string) => `Adapting motifs for ${script}...`,
        stylistName: 'The Decorative Artist',
        styleMsg: 'Applying elegant and fluid aesthetics...',
        abbotName: 'The Aesthetician',
        abbotMsg: 'Exquisite.'
      };
    case ArtStyle.HISTORICAL_DOCUMENTARY:
    case ArtStyle.KEN_BURNS_STORYTELLER:
    case ArtStyle.PROFESSIONAL_PHOTO:
      return {
        researcherName: 'The Archivist',
        researchMsg: 'Searching historical photographic archives...',
        scholarName: 'The Historian',
        translateMsg: (script: string) => `Translating historical context to ${script}...`,
        stylistName: 'The Cinematographer',
        styleMsg: 'Applying documentary and photographic realism...',
        abbotName: 'The Director',
        abbotMsg: 'Cut. Perfect.'
      };
    case ArtStyle.MANGA:
    case ArtStyle.MANGA_MODERN:
    case ArtStyle.UKIYO_E:
    case ArtStyle.JAPANESE_IREZUMI:
      return {
        researcherName: 'The Sensei',
        researchMsg: 'Consulting Japanese visual traditions...',
        scholarName: 'The Translator',
        translateMsg: (script: string) => `Localizing text to ${script}...`,
        stylistName: 'The Mangaka',
        styleMsg: 'Applying Japanese ink and screentone aesthetics...',
        abbotName: 'The Editor',
        abbotMsg: 'Subarashii.'
      };
    case ArtStyle.SCI_FI:
    case ArtStyle.HACKER_MATRIX:
    case ArtStyle.SYNTHWAVE:
    case ArtStyle.GLITCH_ART:
    case ArtStyle.STEAMPUNK_VICTORIAN:
      return {
        researcherName: 'The Futurist',
        researchMsg: 'Analyzing speculative timelines and tech...',
        scholarName: 'The Cryptographer',
        translateMsg: (script: string) => `Encoding data for ${script}...`,
        stylistName: 'The Concept Artist',
        styleMsg: 'Applying futuristic and cyber aesthetics...',
        abbotName: 'The AI Overlord',
        abbotMsg: 'Processing complete.'
      };
    case ArtStyle.FANTASY:
    case ArtStyle.ESCHER_PERSPECTIVE:
    case ArtStyle.FRACTAL_ART:
    case ArtStyle.PSYCHEDELIC:
      return {
        researcherName: 'The Dreamweaver',
        researchMsg: 'Exploring realms of imagination and paradox...',
        scholarName: 'The Bard',
        translateMsg: (script: string) => `Translating lore to ${script}...`,
        stylistName: 'The Illusionist',
        styleMsg: 'Applying surreal and fantastical aesthetics...',
        abbotName: 'The Archmage',
        abbotMsg: 'It is done.'
      };
    default:
      return {
        researcherName: 'The Canon Keeper',
        researchMsg: 'Consulting historical and cultural archives...',
        scholarName: 'The Philologist',
        translateMsg: (script: string) => `Translating primary sources to ${script}...`,
        stylistName: 'The Master Artisan',
        styleMsg: 'Applying visual aesthetics...',
        abbotName: 'The Expert',
        abbotMsg: 'Approved.'
      };
  }
};

const getInitialAgents = (artStyle: ArtStyle): AgentStatus[] => {
  const domain = getLoreDomain(artStyle);
  return [
    { id: AgentType.VISION, name: 'The Visionary', role: 'Visual Analysis', status: 'waiting', log: [] },
    { id: AgentType.STORYTELLER, name: 'The Storyteller', role: 'Narrative Architect', status: 'waiting', log: [] },
    { id: AgentType.PALI_SCHOLAR, name: domain.scholarName, role: 'Textual Translation', status: 'waiting', log: [] },
    { id: AgentType.RESEARCHER, name: domain.researcherName, role: 'Doctrinal Accuracy', status: 'waiting', log: [] },
    { id: AgentType.ROYAL_CRAFTSMAN, name: domain.stylistName, role: 'Visual Aesthetics', status: 'waiting', log: [] },
    { id: AgentType.ICONOGRAPHER, name: 'The Symbolist', role: 'Iconography', status: 'waiting', log: [] },
    { id: AgentType.COMPOSITOR, name: 'The Compositor', role: 'Composition Master', status: 'waiting', log: [] },
    { id: AgentType.ARTISAN, name: 'The Artisan', role: 'Visual Art Generation', status: 'waiting', log: [] },
    { id: AgentType.ARCHITECT, name: 'The Architect', role: 'Geometry Layout', status: 'waiting', log: [] },
    { id: AgentType.CALLIGRAPHER, name: 'The Calligrapher', role: 'Typography', status: 'waiting', log: [] },
    { id: AgentType.SPELLCHECKER, name: 'The Proofreader', role: 'Linguistic Validation', status: 'waiting', log: [] },
    { id: AgentType.ABBOT, name: domain.abbotName, role: 'Final Approval', status: 'waiting', log: [] },
  ];
};



export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [artStyle, setArtStyle] = useState<ArtStyle>(ArtStyle.RATTANAKOSIN);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.STUDIO);
  const [script, setScript] = useState<ScriptType>(ScriptType.ENGLISH);
  const [voiceName, setVoiceName] = useState<string>('Charon');
  const [voicePresetId, setVoicePresetId] = useState<string>('documentary_male');
  const [customVoicePrompt, setCustomPrompt] = useState<string>(VOICE_PRESETS[0].prompt);
  const [customPromptEnabled, setCustomPromptEnabled] = useState<boolean>(false);
  const [applyVoiceTuning, setApplyVoiceTuning] = useState<boolean>(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [textModelOverride, setTextModelOverride] = useState<string>('');
  const [ttsModelOverride, setTtsModelOverride] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT_3_4);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment & { name: string } | null>(null);
  
  const [agents, setAgents] = useState<AgentStatus[]>(getInitialAgents(ArtStyle.RATTANAKOSIN));
  const [isLoading, setIsLoading] = useState(false);
  const [currentDiagrams, setCurrentDiagrams] = useState<DiagramData[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isCopiedTxt, setIsCopiedTxt] = useState(false);
  const [isCopiedMd, setIsCopiedMd] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioProgressText, setAudioProgressText] = useState<string | null>(null);
  const [audioErrorMessage, setAudioErrorMessage] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoVisualMode, setVideoVisualMode] = useState<'master' | 'bg_only'>('master');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNarrative = generationMode === GenerationMode.NARRATIVE;

  const cleanTextForSpeech = (text: string) => {
    if (!text) return "";
    return text
      // Remove "Scene X:", "Slide X:", "(Scene X of Y):" etc.
      .replace(/^(Scene|Slide)\s*\d+\s*[:\-]?\s*/i, '')
      .replace(/^\(Scene\s*\d+\s*of\s*\d+\)\s*[:\-]?\s*/i, '')
      .replace(/^Scene\s*\d+\s*[:\-]?\s*/i, '')
      // Remove markdown headings
      .replace(/^#+\s+/gm, '')
      // Remove markdown bold and italics
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove bullet markers
      .replace(/^[\*\-•]\s+/gm, '')
      // Remove backticks and code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown links [text](url)
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove XML/HTML tags
      .replace(/<[^>]*>/g, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleShare = async () => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram) return;

    const baseUrl = "https://omni-content-creator-594226924032.us-west1.run.app";
    const shareText = `I made some amazing content using Omni-Content Creator: ${currentDiagram.title}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Omni-Content Creator',
          text: shareText,
          url: baseUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${baseUrl}`);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 3000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleGenerateAudio = async (targetMode: 'current' | 'all' = 'current') => {
    if (currentDiagrams.length === 0) return;
    setIsGeneratingAudio(true);
    setAudioErrorMessage(null);
    setAudioProgressText("Initializing audio...");
    
    try {
      if (isNarrative && targetMode === 'all') {
        // Generate audio for all slides with progressive real-time save
        const total = currentDiagrams.length;
        let successCount = 0;
        
        for (let i = 0; i < total; i++) {
          const d = currentDiagrams[i];
          const cleanTitle = cleanTextForSpeech(d.title);
          const cleanStory = cleanTextForSpeech(d.story_text || d.final_humanized_output || d.description);
          const textToSpeak = `${cleanTitle}. ${cleanStory}`;
          
          setAudioProgressText(`Slide ${i + 1}/${total}...`);
          console.log(`[Audio] Generating speech for Slide ${i + 1}/${total}...`);
          
          try {
            const { audioUrl, blob, mp3Blob, mp3Url } = await generateSpeech(
              textToSpeak,
              voiceName,
              applyVoiceTuning ? customVoicePrompt : undefined,
              (curr, totalParts) => {
                setAudioProgressText(`Slide ${i + 1}/${total} (Part ${curr}/${totalParts})`);
              }
            );
            
            // Immediately save each slide's audio into state as it finishes!
            setCurrentDiagrams(prev => {
              const next = [...prev];
              if (next[i]) {
                next[i] = {
                  ...next[i],
                  audioUrl,
                  audioBlob: blob,
                  mp3Url,
                  mp3Blob
                };
              }
              return next;
            });
            successCount++;
          } catch (slideErr: any) {
            console.error(`[Audio] Failed on slide ${i + 1}:`, slideErr);
            throw new Error(`Slide ${i + 1} failed: ${slideErr.message || 'Error generating speech segment'}. (Slides 1-${successCount} were saved).`);
          }
          
          // Delay between slides to respect API pacing
          if (i < total - 1) {
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }
      } else {
        // Single slide generation (Current Slide in Narrative, or Studio single view)
        const targetIndex = currentSlideIndex;
        const d = currentDiagrams[targetIndex];
        if (!d) return;

        const cleanTitle = cleanTextForSpeech(d.title);
        const cleanStory = cleanTextForSpeech(d.story_text || d.final_humanized_output || d.description);
        const textToSpeak = `${cleanTitle}. ${cleanStory}`;

        setAudioProgressText(isNarrative ? `Slide ${targetIndex + 1}...` : "Synthesizing audio...");
        const { audioUrl, blob, mp3Blob, mp3Url } = await generateSpeech(
          textToSpeak,
          voiceName,
          applyVoiceTuning ? customVoicePrompt : undefined,
          (curr, totalParts) => {
            setAudioProgressText(isNarrative 
              ? `Slide ${targetIndex + 1} (Part ${curr}/${totalParts})` 
              : `Synthesizing (Part ${curr}/${totalParts})...`);
          }
        );
        
        // Immediately persist into currentDiagrams
        setCurrentDiagrams(prev => {
          const next = [...prev];
          if (next[targetIndex]) {
            next[targetIndex] = {
              ...next[targetIndex],
              audioUrl,
              audioBlob: blob,
              mp3Url,
              mp3Blob
            };
          }
          return next;
        });

        if (!isNarrative) {
          // Automatically trigger download for single podcast
          const link = document.createElement('a');
          link.href = mp3Url;
          link.download = `${(d.title || 'audio-podcast').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err: any) {
      console.error('Audio generation error:', err);
      const msg = err.message || 'Unknown audio generation error';
      if (msg.includes('403') || msg.includes('Forbidden')) {
        setAudioErrorMessage(`Access Forbidden (403). Please verify that your Gemini API key has access to the Gemini TTS model.`);
      } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        setAudioErrorMessage(`Rate limit reached (429). Completed slides have been preserved. Wait a moment and click to generate the remaining slide.`);
      } else {
        setAudioErrorMessage(`Audio generation notice: ${msg}`);
      }
    } finally {
      setIsGeneratingAudio(false);
      setAudioProgressText(null);
    }
  };

  const downloadAudio = async (format: 'wav' | 'mp3' = 'mp3', scope: 'current' | 'merged' = 'current') => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (scope === 'merged' && isNarrative) {
      // Merge all slide audio blobs
      const blobs = currentDiagrams.map(d => d.audioBlob).filter(Boolean) as Blob[];
      if (blobs.length === 0) return;
      
      try {
        const pcmData = await mergeAudioBlobs(blobs);
        let mergedBlob: Blob;
        try {
          mergedBlob = format === 'wav' ? pcmToWav(pcmData, 24000) : pcmToMp3(pcmData, 24000);
        } catch (e) {
          console.warn("MP3 merge failed, falling back to WAV", e);
          mergedBlob = pcmToWav(pcmData, 24000);
        }
        
        const url = URL.createObjectURL(mergedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(currentDiagrams[0]?.title || 'narrative-audio').replace(/[^a-zA-Z0-9_-]/g, '_')}.${format === 'mp3' && mergedBlob.type.includes('mpeg') ? 'mp3' : 'wav'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to merge audio:", err);
        setAudioErrorMessage("Failed to merge audio slides into one file. Please download individual slides instead.");
      }
    } else {
      // Current slide download
      const targetDiagram = currentDiagram || currentDiagrams[0];
      if (!targetDiagram) return;
      
      if (format === 'mp3' && targetDiagram.mp3Url) {
        const link = document.createElement('a');
        link.href = targetDiagram.mp3Url;
        link.download = `${(targetDiagram.title || `slide-${currentSlideIndex + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const blob = format === 'wav' ? targetDiagram.audioBlob : targetDiagram.mp3Blob;
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(targetDiagram.title || `slide-${currentSlideIndex + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_')}.${format === 'mp3' && blob.type.includes('mpeg') ? 'mp3' : 'wav'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadAllAssets = async () => {
    if (!currentDiagrams || currentDiagrams.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();

      for (let i = 0; i < currentDiagrams.length; i++) {
        const d = currentDiagrams[i];
        
        const slideIndex = i + 1;
        const safeTitle = d.title ? d.title.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').substring(0, 30) : 'Slide';
        const folderName = `Slide_${slideIndex}_${safeTitle}`;
        const folder = zip.folder(folderName);
        if (!folder) continue;

        // MD text
        const mdText = `# ${d.title}\n\n${d.description}\n\n${d.story_text || ''}\n\n${d.final_humanized_output || ''}`;
        folder.file("content.md", mdText);

        // SVG
        if (d.svg) {
          folder.file("infographic.svg", d.svg);
        }

        // Background Image
        if (d.backgroundUrl) {
          if (d.backgroundUrl.startsWith('data:image/')) {
            const base64Data = d.backgroundUrl.split(',')[1];
            folder.file("background.png", base64Data, { base64: true });
          } else {
            try {
              const response = await fetch(d.backgroundUrl);
              const blob = await response.blob();
              folder.file("background.png", blob);
            } catch (err) {
              console.error("Failed to fetch background image for zipping", err);
            }
          }
        }

        // Audio
        if (d.mp3Blob) {
          folder.file("narration.mp3", d.mp3Blob);
        } else if (d.audioBlob) {
          folder.file("narration.wav", d.audioBlob);
        } else if (d.mp3Url) {
           try {
              const response = await fetch(d.mp3Url);
              const blob = await response.blob();
              folder.file("narration.mp3", blob);
            } catch (err) {
              console.error("Failed to fetch mp3 image for zipping", err);
            }
        } else if (d.audioUrl) {
           try {
              const response = await fetch(d.audioUrl);
              const blob = await response.blob();
              folder.file("narration.wav", blob);
            } catch (err) {
              console.error("Failed to fetch audio for zipping", err);
            }
        }

        // Video
        if (d.videoBlob) {
          const extension = d.videoBlob.type.includes('webm') ? 'webm' : 'mp4';
          folder.file(`video.${extension}`, d.videoBlob);
        } else if (d.videoUrl) {
           try {
              const response = await fetch(d.videoUrl);
              const blob = await response.blob();
              const extension = blob.type.includes('webm') ? 'webm' : 'mp4';
              folder.file(`video.${extension}`, blob);
            } catch (err) {
              console.error("Failed to fetch video for zipping", err);
            }
        }
      }

      console.log("Generating ZIP archive...");
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "omni_content_project_assets.zip");
      console.log("ZIP archive downloaded.");
    } catch (error) {
      console.error("Error creating zip file:", error);
      alert("Failed to create ZIP package. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSVG = () => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram || !currentDiagram.svg) return;
    
    // Simple SVG download from raw content
    const blob = new Blob([currentDiagram.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDiagram.title || 'omni-content'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePngBlobForDiagram = async (diagram: DiagramData, ratio: AspectRatio): Promise<Blob | null> => {
    const { width, height } = getDimensions(ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    await new Promise((res) => {
      bgImg.onload = () => res(true);
      bgImg.onerror = () => {
        ctx.fillStyle = '#1a1005';
        ctx.fillRect(0, 0, width, height);
        res(false);
      };
      const fallbackSvg = `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221920%22%20height%3D%221080%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231a110a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22serif%22%20font-size%3D%2224%22%20fill%3D%22%23d4af37%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EArt%20Generation%20Failed%20(Safety%2FAPI%20Error)%3C%2Ftext%3E%3C%2Fsvg%3E`;
      bgImg.src = diagram.backgroundUrl || fallbackSvg;
    });

    if (bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, width, height);
    }

    ctx.fillStyle = 'rgba(42, 10, 10, 0.35)';
    ctx.fillRect(0, 0, width, height);

    if (diagram.svg) {
      const svgImg = new Image();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(diagram.svg, "image/svg+xml");
      const svgEl = svgDoc.querySelector("svg");
      if (svgEl) {
        svgEl.setAttribute("width", width.toString());
        svgEl.setAttribute("height", height.toString());
        svgEl.style.background = "transparent";
        svgEl.style.backgroundColor = "transparent";
        
        const rects = svgEl.querySelectorAll('rect');
        rects.forEach(rect => {
          const w = rect.getAttribute('width');
          const h = rect.getAttribute('height');
          if ((w === '100%' || parseInt(w || '0') >= width * 0.9) && 
              (h === '100%' || parseInt(h || '0') >= height * 0.9)) {
            rect.setAttribute('fill', 'none');
            rect.setAttribute('fill-opacity', '0');
          }
        });
      }
      const serializedSvg = new XMLSerializer().serializeToString(svgDoc);
      const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      await new Promise((res) => {
        svgImg.onload = () => {
          ctx.drawImage(svgImg, 0, 0, width, height);
          URL.revokeObjectURL(url);
          res(null);
        };
        svgImg.onerror = () => res(null);
        svgImg.src = url;
      });
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  };

  const downloadPng = async () => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram) return;

    const blob = await generatePngBlobForDiagram(currentDiagram, aspectRatio);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDiagram.title || 'visual-art'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBgArt = async () => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram?.backgroundUrl) return;
    
    try {
      // If it's already a data URL, we can just download it
      if (currentDiagram.backgroundUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = currentDiagram.backgroundUrl;
        link.download = `${currentDiagram.title || 'visual-art'}-background.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Otherwise, fetch it as a blob to force download and avoid navigation
      const response = await fetch(currentDiagram.backgroundUrl, { mode: 'no-cors' });
      // Note: 'no-cors' will return an opaque response which we can't read as blob
      // So we try regular fetch first
      try {
        const corsResponse = await fetch(currentDiagram.backgroundUrl);
        const blob = await corsResponse.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentDiagram.title || 'visual-art'}-background.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (corsErr) {
        console.warn("CORS fetch failed, falling back to direct download link:", corsErr);
        const link = document.createElement('a');
        link.href = currentDiagram.backgroundUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = `${currentDiagram.title || 'visual-art'}-background.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Background art download failed:", err);
      alert("Could not download background art. You can try right-clicking the image to save it.");
    }
  };

  const downloadMasterArchive = async () => {
    if (currentDiagrams.length === 0) return;
    setIsLoading(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < currentDiagrams.length; i++) {
        const diagram = currentDiagrams[i];
        const folderName = `Slide_${i + 1}_${diagram.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}`;
        const folder = zip.folder(folderName);
        if (!folder) continue;

        // 1. Markdown
        if (diagram.story_text) {
          folder.file(`${diagram.title || 'script'}.md`, diagram.story_text);
        }

        // 2. SVG Vector
        if (diagram.svg) {
          folder.file(`${diagram.title || 'vector'}.svg`, diagram.svg);
        }

        // 3. Background Art
        if (diagram.backgroundUrl) {
          try {
            const bgResponse = await fetch(diagram.backgroundUrl);
            const bgBlob = await bgResponse.blob();
            folder.file(`${diagram.title || 'background'}.png`, bgBlob);
          } catch (e) {
            console.warn(`Could not fetch background for slide ${i + 1}`, e);
          }
        }

        // 4. Master PNG
        const masterPngBlob = await generatePngBlobForDiagram(diagram, aspectRatio);
        if (masterPngBlob) {
          folder.file(`${diagram.title || 'master'}.png`, masterPngBlob);
        }

        // 5. Audio
        if (diagram.mp3Blob) {
          folder.file(`${diagram.title || 'audio'}.mp3`, diagram.mp3Blob);
        } else if (diagram.audioBlob) {
          folder.file(`${diagram.title || 'audio'}.wav`, diagram.audioBlob);
        }

        // 6. Video
        if (diagram.videoBlob) {
          const extension = diagram.videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
          folder.file(`${diagram.title || 'video'}.${extension}`, diagram.videoBlob);
        }
      }

      // Add merged audio if narrative mode and we have multiple slides
      if (isNarrative && currentDiagrams.length > 1) {
        const blobs = currentDiagrams.map(d => d.audioBlob).filter(Boolean) as Blob[];
        if (blobs.length > 0) {
          try {
            const pcmData = await mergeAudioBlobs(blobs);
            let mergedBlob;
            try {
              mergedBlob = pcmToMp3(pcmData, 24000);
              zip.file(`Full_Narrative_Audio.mp3`, mergedBlob);
            } catch (e) {
              mergedBlob = pcmToWav(pcmData, 24000);
              zip.file(`Full_Narrative_Audio.wav`, mergedBlob);
            }
          } catch (e) {
            console.warn("Could not merge audio for master archive", e);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OmniContent_MasterArchive.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Master Archive generation failed:", err);
      alert("Failed to generate Master Archive. Please try downloading files individually.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (currentDiagrams.length === 0) {
      console.warn("No diagrams to generate video from.");
      return;
    }
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram?.audioBlob) {
      console.warn("No audio blob found for current diagram.");
      alert("Please generate audio first before creating a video.");
      return;
    }
    
    if (typeof MediaRecorder === 'undefined') {
      console.error("MediaRecorder is not supported in this browser.");
      alert("Your browser does not support video recording. Please try a modern browser like Chrome, Firefox, or Safari.");
      return;
    }
    
    console.log("Starting video generation process...", {
      isNarrative,
      slideCount: currentDiagrams.length,
      audioSize: currentDiagram.audioBlob.size
    });
    
    // Unlock audio context immediately on user gesture
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      ctx.resume();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.001);
    } catch (e) {
      console.warn("Could not unlock audio context:", e);
    }
    
    setIsGeneratingVideo(true);
    setVideoStatus("Preparing slides...");
    try {
      let slidesToRender: { imageUrl: string; svgContent: string | null; audioBlob?: Blob }[] = [];
      
      if (isNarrative) {
        // Full Documentary: All slides with their individual audio
        slidesToRender = currentDiagrams.map(d => ({
          imageUrl: d.backgroundUrl || '',
          svgContent: videoVisualMode === 'master' ? d.svg : null,
          audioBlob: d.audioBlob
        }));
      } else {
        // Audio Podcast: Current slide only
        slidesToRender = [{
          imageUrl: currentDiagram.backgroundUrl || '',
          svgContent: videoVisualMode === 'master' ? currentDiagram.svg : null,
          audioBlob: currentDiagram.audioBlob
        }];
      }

      console.log(`Rendering ${slidesToRender.length} slides for video...`);
      setVideoStatus(`Recording ${slidesToRender.length} slides...`);

      const { width, height } = getDimensions(aspectRatio);

      const { videoUrl, blob } = await createVideoFromImagesAndAudio(
        slidesToRender,
        width,
        height,
        (status) => setVideoStatus(status)
      );
      
      setVideoStatus("Finalizing video...");
      console.log("Video generation successful, updating state...");
      const updatedDiagrams = currentDiagrams.map(d => ({ ...d }));
      if (isNarrative) {
        // Update all slides with the same documentary video
        updatedDiagrams.forEach(d => {
          d.videoUrl = videoUrl;
          d.videoBlob = blob;
        });
      } else {
        updatedDiagrams[currentSlideIndex].videoUrl = videoUrl;
        updatedDiagrams[currentSlideIndex].videoBlob = blob;
      }
      setCurrentDiagrams(updatedDiagrams);

      // Automatically trigger download for the user
      console.log("Triggering automatic download...");
      const link = document.createElement('a');
      link.href = videoUrl;
      const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
      link.download = `${currentDiagram.title || 'video-documentary'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Automatic download triggered.");

    } catch (err: any) {
      console.error('Video generation error:', err);
      alert(`Video generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingVideo(false);
      setVideoStatus(null);
    }
  };

  const downloadVideo = () => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram?.videoBlob) {
      console.warn("No video blob found to download.");
      alert("No video has been generated for this slide yet.");
      return;
    }
    
    console.log("Downloading video...", {
      type: currentDiagram.videoBlob.type,
      size: currentDiagram.videoBlob.size
    });
    
    const extension = currentDiagram.videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const url = URL.createObjectURL(currentDiagram.videoBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDiagram.title || 'video-documentary'}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log("Download triggered.");
  };

  useEffect(() => {
    return () => {
      currentDiagrams.forEach(d => {
        if (d.audioUrl) URL.revokeObjectURL(d.audioUrl);
      });
    };
  }, [currentDiagrams]);

  useEffect(() => {
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    }
    setTextModelOverride(getStoredTextModel());
    setTtsModelOverride(getStoredTtsModel());
    setIsInitializing(false);
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      setStoredApiKey(apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
    }
  };

  const handleLogout = () => {
    removeStoredApiKey();
    setApiKey(null);
    setApiKeyInput('');
  };

  const handleVoiceChange = (newVoiceId: string) => {
    setVoiceName(newVoiceId);
  };

  const handleVoicePresetChange = (newPresetId: string) => {
    setVoicePresetId(newPresetId);
    const preset = VOICE_PRESETS.find(p => p.id === newPresetId);
    if (preset) {
      setCustomPrompt(preset.prompt);
      setVoiceName(preset.baseVoice);
    }
  };

  const handleArtStyleChange = (newStyle: ArtStyle) => {
    setArtStyle(newStyle);
    setCurrentDiagrams([]);
    setCurrentSlideIndex(0);
    setAgents(getInitialAgents(newStyle));
  };

  const handleGenerationModeChange = (newMode: GenerationMode) => {
    setGenerationMode(newMode);
    setCurrentDiagrams([]);
    setCurrentSlideIndex(0);
    setAgents(getInitialAgents(artStyle));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setAttachment({
          type: file.type === 'application/pdf' ? 'pdf' : 'image',
          mimeType: file.type,
          data: base64Data,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onloadend = () => {
        const textContent = reader.result as string;
        setAttachment({
          type: 'text',
          mimeType: file.type || 'text/plain',
          data: textContent,
          name: file.name
        });
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const clearAttachment = () => {
    setAttachment(null);
  };

  const clearInput = () => {
    setInput('');
  };

  const downloadDescription = (format: 'txt' | 'md') => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram) return;
    const content = format === 'md' 
      ? `# ${currentDiagram.title}\n\n## ${currentDiagram.contextTitle || 'Treatise'}\n\n${currentDiagram.story_text || currentDiagram.final_humanized_output || currentDiagram.description}`
      : `${currentDiagram.title}\n\n${currentDiagram.contextTitle || 'Treatise'}\n\n${currentDiagram.story_text || currentDiagram.final_humanized_output || currentDiagram.description}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDiagram.title || 'visual-treatise'}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyDescription = async (format: 'txt' | 'md') => {
    const currentDiagram = currentDiagrams[currentSlideIndex];
    if (!currentDiagram) return;
    const content = format === 'md' 
      ? `# ${currentDiagram.title}\n\n## ${currentDiagram.contextTitle || 'Treatise'}\n\n${currentDiagram.story_text || currentDiagram.final_humanized_output || currentDiagram.description}`
      : `${currentDiagram.title}\n\n${currentDiagram.contextTitle || 'Treatise'}\n\n${currentDiagram.story_text || currentDiagram.final_humanized_output || currentDiagram.description}`;
    
    try {
      await navigator.clipboard.writeText(content);
      if (format === 'txt') {
        setIsCopiedTxt(true);
        setTimeout(() => setIsCopiedTxt(false), 2000);
      } else {
        setIsCopiedMd(true);
        setTimeout(() => setIsCopiedMd(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const simulateAgentWorkflow = async () => {
    const domain = getLoreDomain(artStyle);
    setAgents(getInitialAgents(artStyle).map(a => ({ ...a, status: 'waiting', log: [] })));
    
    const updateAgent = (id: AgentType, status: AgentStatus['status'], logMsg?: string) => {
      setAgents(prev => prev.map(a => {
        if (a.id === id) {
          const newLog = logMsg ? [...a.log, logMsg] : a.log;
          return { ...a, status, log: newLog };
        }
        return a;
      }));
    };

    // 1. Vision / Perception (Common)
    if (attachment) {
      updateAgent(AgentType.VISION, 'active', attachment.type === 'image' ? 'Contemplating image...' : attachment.type === 'pdf' ? 'Reading PDF...' : 'Reading text...');
      await new Promise(r => setTimeout(r, 800));
      updateAgent(AgentType.VISION, 'completed', 'Insight gained.');
    } else {
       updateAgent(AgentType.VISION, 'completed', 'No external object.');
    }

    // 2. Knowledge Pipeline (Forked)
    if (isNarrative) {
      updateAgent(AgentType.STORYTELLER, 'active', 'Weaving Narrative Arc...');
      await new Promise(r => setTimeout(r, 1500));
      updateAgent(AgentType.STORYTELLER, 'completed', 'Story structure defined.');
    }

    updateAgent(AgentType.RESEARCHER, 'active', domain.researchMsg);
    updateAgent(AgentType.PALI_SCHOLAR, 'active', domain.translateMsg(script));
    await new Promise(r => setTimeout(r, 1000));
    updateAgent(AgentType.RESEARCHER, 'completed');
    updateAgent(AgentType.PALI_SCHOLAR, 'completed');

    // 3. Style & Iconography
    let styleLog = domain.styleMsg;
    let symbolLog = `Manifesting ${artStyle.replace(/_/g, ' ').toLowerCase()} iconography...`;
    
    if (isNarrative) {
      styleLog = 'Designing visual brochure layout...';
      symbolLog = 'Selecting illustrative icons...';
    }

    updateAgent(AgentType.ROYAL_CRAFTSMAN, 'active', styleLog);
    updateAgent(AgentType.ICONOGRAPHER, 'active', symbolLog);
    await new Promise(r => setTimeout(r, 800));
    updateAgent(AgentType.ROYAL_CRAFTSMAN, 'completed');
    updateAgent(AgentType.ICONOGRAPHER, 'completed');

    // 3.5 Composition
    updateAgent(AgentType.COMPOSITOR, 'active', 'Harmonizing visual proportions...');
    await new Promise(r => setTimeout(r, 800));
    updateAgent(AgentType.COMPOSITOR, 'completed', 'Aesthetic balance achieved.');

    // 4. Creation (Common - Both use Artisan for Background)
    let artisanLog = `Generating ${artStyle.replace(/_/g, ' ').toLowerCase()} background...`;
    if (isNarrative) artisanLog = 'Generating Scene Backgrounds...';

    updateAgent(AgentType.ARTISAN, 'active', artisanLog);
    await new Promise(r => setTimeout(r, isNarrative ? 4000 : 2000)); 
    
    // Updated Architect Logic
    updateAgent(AgentType.ARCHITECT, 'active', 'Infusing Geometry...');
    await new Promise(r => setTimeout(r, 500));
    
    updateAgent(AgentType.ARTISAN, 'completed', 'Visual mural complete.');
    updateAgent(AgentType.ARCHITECT, 'completed', 'Geometry aligned.');

    // Updated Calligrapher Logic
    updateAgent(AgentType.CALLIGRAPHER, 'active', `Selecting fonts for ${script}...`);
    await new Promise(r => setTimeout(r, 500));
    updateAgent(AgentType.CALLIGRAPHER, 'completed', 'Typography refined.');

    // 5. Proofreading Logic
    updateAgent(AgentType.SPELLCHECKER, 'active', `Checking ${script} for hallucinations...`);
    await new Promise(r => setTimeout(r, 800));
    updateAgent(AgentType.SPELLCHECKER, 'active', 'Validating doctrinal terms...');
    await new Promise(r => setTimeout(r, 800));
    updateAgent(AgentType.SPELLCHECKER, 'completed', 'Linguistics verified.');

    // 6. Final Approval
    updateAgent(AgentType.ABBOT, 'active', 'Final aesthetic review...');
    await new Promise(r => setTimeout(r, 800));
    updateAgent(AgentType.ABBOT, 'completed', domain.abbotMsg);
  };

  const handleRender = async () => {
    if (!input && !attachment) {
      alert("Please provide a topic or file.");
      return;
    }

    setIsLoading(true);
    setCurrentDiagrams([]);
    setCurrentSlideIndex(0);

    try {
      const simulationPromise = simulateAgentWorkflow();
      
      let apiPromise;
      if (isNarrative) {
        apiPromise = generateSlideDeck(input, artStyle, script, aspectRatio, attachment || undefined);
      } else {
        apiPromise = generateDiagram(input, artStyle, script, aspectRatio, attachment || undefined).then(d => [d]);
      }
      
      const [result] = await Promise.all([apiPromise, simulationPromise]);
      setCurrentDiagrams(result);

    } catch (error: any) {
      console.error(error);
      let errorMessage = error.message || "Unknown error";
      
      if (errorMessage === "API_KEY_REQUIRED") {
        errorMessage = "Please provide your Gemini API Key first.";
        handleLogout(); // Show login screen
      } else if (errorMessage.includes("Requested entity was not found")) {
        // Reset key selection state as per instructions for Veo/Image models
        setApiKey(null);
        errorMessage = "API Key error. Please enter your API key again.";
      }
      
      setAgents(prev => prev.map(a => 
        a.status === 'active' 
          ? { ...a, status: 'waiting', log: [...a.log, 'Failed.'] } 
          : a
      ));

      alert(`The Scribe encountered an obstacle: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < currentDiagrams.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const currentDiagram = currentDiagrams[currentSlideIndex];

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#1a1005] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Palette className="w-12 h-12 text-rattanakosin-gold animate-spin-slow" />
          <p className="text-rattanakosin-gold font-mono text-sm animate-pulse">Entering the Creative Space...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-[#1a1005] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl space-y-8 animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-rattanakosin-900 border border-rattanakosin-gold/30 shadow-2xl shadow-rattanakosin-gold/10">
              <Palette className="w-16 h-16 text-rattanakosin-gold animate-spin-slow" />
            </div>
            <h1 className="text-5xl font-bold font-display text-rattanakosin-gold tracking-tight">
              Omni-Content Creator
            </h1>
            <p className="text-rattanakosin-100/70 font-serif text-lg leading-relaxed">
              Manifest visual infographics and visual treatises through the power of advanced AI. 
              Secure, scholarly, and traditionally inspired.
            </p>
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-[#1e1205] border border-rattanakosin-800 shadow-2xl space-y-6 sm:space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2 text-left">
                <h2 className="text-rattanakosin-gold font-bold uppercase tracking-widest text-sm sm:text-base">Bring Your Own Key</h2>
                <p className="text-rattanakosin-100/60 text-xs sm:text-sm">
                  Enter your Google Gemini API Key to begin. Your key is stored locally entirely on your device.
                </p>
              </div>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-12 h-12 shrink-0 rounded-full bg-rattanakosin-900 border border-rattanakosin-gold/30 hover:bg-rattanakosin-gold/15 flex items-center justify-center transition-colors cursor-pointer text-rattanakosin-gold"
                title="Model Config overrides"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveApiKey} className="space-y-4 sm:space-y-6">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rattanakosin-gold/50" />
                <label htmlFor="apiKeyInput" className="sr-only">Gemini API Key</label>
                <input 
                  id="apiKeyInput"
                  name="apiKeyInput"
                  type="password"
                  placeholder="Enter Gemini API Key..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 sm:py-5 rounded-xl bg-[#120a02] border border-rattanakosin-900 text-rattanakosin-50 focus:outline-none focus:ring-2 focus:ring-rattanakosin-600 transition-all placeholder-rattanakosin-900 text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button 
                  type="submit"
                  disabled={!apiKeyInput.trim()}
                  className="flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-xl bg-rattanakosin-600 text-white font-bold hover:bg-rattanakosin-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base uppercase tracking-widest"
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  Save API Key
                </button>
              </div>
            </form>

            <div className="pt-4 sm:pt-6 border-t border-rattanakosin-900 flex flex-col items-center gap-3 text-center">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-rattanakosin-gold hover:underline uppercase tracking-widest"
              >
                Get a free API Key from Google AI Studio
              </a>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-rattanakosin-gold/50 hover:underline uppercase tracking-widest"
              >
                Billing Documentation (Paid Tier)
              </a>
            </div>
          </div>

          <p className="text-[10px] sm:text-xs text-rattanakosin-100/30 font-mono uppercase tracking-widest">
            Created by Ajarn Spencer Littlewood • Buddha Magic Multimedia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans flex flex-col bg-[#2a1b0a] text-rattanakosin-50`}>
      
      {/* Top Navigation Bar */}
      <nav className={`sticky top-0 w-full z-50 border-b backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-500 bg-[#1a1005]/90 border-rattanakosin-800`}>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className={`p-2 rounded-full bg-rattanakosin-600 text-white shrink-0`}>
             <Palette className="w-8 h-8 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight font-display text-rattanakosin-gold truncate`}>
              Omni-Content Creator
            </h1>
            <p className="text-xs sm:text-sm opacity-90 uppercase tracking-wider font-mono max-w-xl leading-tight truncate sm:whitespace-normal">
              Multilingual Geometry & Infographic Generator. Created by Ajarn Spencer Littlewood.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto justify-between sm:justify-end flex-wrap gap-y-4">
           {/* API Key Status */}
           <div className="flex items-center gap-3 sm:gap-4 pr-3 sm:pr-4 border-r border-rattanakosin-800">
             <div className="text-right hidden xs:block">
               <p className="text-xs sm:text-sm font-bold text-rattanakosin-gold uppercase tracking-tighter">BYOK Mode</p>
               <p className="text-[10px] sm:text-xs text-rattanakosin-100/70 truncate max-w-[80px] sm:max-w-[120px]">Key: •••{apiKey.slice(-4)}</p>
             </div>
             <div className="flex items-center gap-2">
               <button 
                 onClick={() => setShowCollaboratorsModal(true)}
                 className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rattanakosin-900 hover:bg-rattanakosin-gold/15 flex items-center justify-center border border-rattanakosin-gold/30 transition-colors cursor-pointer"
                 title="Authors & Collaborators"
               >
                 <Users className="w-5 h-5 sm:w-6 sm:h-6 text-rattanakosin-gold" />
               </button>
               <div className="relative group">
                 <button 
                   onClick={() => setShowSettingsModal(true)}
                   className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rattanakosin-900 flex items-center justify-center border border-rattanakosin-gold/30 hover:bg-rattanakosin-gold/15 transition-colors cursor-pointer"
                   title="Model Overrides & Settings"
                 >
                   <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-rattanakosin-gold" />
                 </button>
                 <button 
                   onClick={handleLogout}
                   className="absolute -bottom-1 -right-1 p-2 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                   title="Clear API Key"
                 >
                   <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                 </button>
               </div>
             </div>
           </div>
           {/* Generation Mode Selector */}
           <div className="flex bg-rattanakosin-900/50 p-1 sm:p-1.5 rounded-full border border-rattanakosin-gold/30">
             {[
               { id: GenerationMode.STUDIO, label: 'STUDIO', icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> },
               { id: GenerationMode.NARRATIVE, label: 'NARRATIVE', icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> },
             ].map((gMode) => (
               <button
                 key={gMode.id}
                 onClick={() => handleGenerationModeChange(gMode.id)}
                 className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                   generationMode === gMode.id 
                     ? 'bg-rattanakosin-600 text-white shadow-lg' 
                     : 'text-rattanakosin-400 hover:text-rattanakosin-200'
                 }`}
               >
                 {gMode.icon}
                 <span className="hidden xs:inline">{gMode.label}</span>
               </button>
             ))}
           </div>

           {/* Voice Selector */}
           <div className="relative">
             <label htmlFor="voiceSelect" className="sr-only">Voice</label>
             <select
               id="voiceSelect"
               name="voiceSelect"
               value={voiceName}
               onChange={(e) => handleVoiceChange(e.target.value)}
               className={`appearance-none bg-rattanakosin-900/50 border border-rattanakosin-gold/30 text-rattanakosin-gold text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-3 pr-8 sm:pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-rattanakosin-600 transition-all cursor-pointer shadow-lg`}
             >
               <option value="Charon" className="bg-[#120a02] text-rattanakosin-50 uppercase">MALE (CHARON)</option>
               <option value="Puck" className="bg-[#120a02] text-rattanakosin-50 uppercase">MALE (PUCK)</option>
               <option value="Kore" className="bg-[#120a02] text-rattanakosin-50 uppercase">FEMALE (KORE)</option>
               <option value="Fenrir" className="bg-[#120a02] text-rattanakosin-50 uppercase">MALE (FENRIR)</option>
               <option value="Zephyr" className="bg-[#120a02] text-rattanakosin-50 uppercase">FEMALE (ZEPHYR)</option>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 sm:px-4 text-rattanakosin-gold">
               <svg className="fill-current h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
           </div>

           {/* Art Style Selector */}
           <div className="relative">
             <label htmlFor="artStyleSelect" className="sr-only">Art Style</label>
             <select
               id="artStyleSelect"
               name="artStyleSelect"
               value={artStyle}
               onChange={(e) => handleArtStyleChange(e.target.value as ArtStyle)}
               className={`appearance-none bg-rattanakosin-900/50 border border-rattanakosin-gold/30 text-rattanakosin-gold text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-3 pr-8 sm:pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-rattanakosin-600 transition-all cursor-pointer shadow-lg uppercase`}
             >
               {Object.values(ArtStyle).map((style) => (
                 <option key={style} value={style} className="bg-[#120a02] text-rattanakosin-50 uppercase">
                   {style.replace(/_/g, ' ')}
                 </option>
               ))}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 sm:px-4 text-rattanakosin-gold">
               <svg className="fill-current h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 md:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Inputs & Controls */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          <div className={`p-6 rounded-2xl border shadow-xl transition-all duration-300 bg-[#1e1205] border-rattanakosin-800 shadow-black/50`}>
            
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold flex items-center gap-2 text-rattanakosin-gold font-display capitalize`}>
                <Sparkles className="w-5 h-5" />
                {generationMode === GenerationMode.STUDIO ? `${artStyle.replace(/_/g, ' ').toLowerCase()} Studio` : 'Narrative Studio'}
              </h2>
              {input.length > 0 && (
                <button onClick={clearInput} className="text-xs opacity-50 hover:opacity-100 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* SCRIPT SELECTOR */}
            <div className="mb-4">
               <label htmlFor="scriptSelect" className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-rattanakosin-100/50`}>
                 <Languages className="w-3 h-3" /> Script / Language
               </label>
               <div className="relative">
                 <select
                    id="scriptSelect"
                    name="scriptSelect"
                    value={script}
                    onChange={(e) => setScript(e.target.value as ScriptType)}
                    className={`w-full p-3 rounded-xl appearance-none text-sm font-medium focus:outline-none focus:ring-2 transition-all cursor-pointer bg-[#120a02] border border-rattanakosin-900 text-rattanakosin-50 focus:ring-rattanakosin-600 hover:bg-rattanakosin-900/40 shadow-lg`}
                 >
                    {Object.values(ScriptType).map((s) => (
                      <option key={s} value={s} className="bg-[#120a02] text-rattanakosin-50">{s}</option>
                    ))}
                 </select>
                 <div className={`absolute right-3 top-3 pointer-events-none opacity-50 text-rattanakosin-gold`}>
                    ▼
                 </div>
               </div>
            </div>

            {/* ASPECT RATIO SELECTOR */}
            <div className="mb-4">
               <label htmlFor="aspectRatioSelect" className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-rattanakosin-100/50`}>
                 <Maximize className="w-3 h-3" /> Aspect Ratio
               </label>
               <div className="relative">
                 <select
                    id="aspectRatioSelect"
                    name="aspectRatioSelect"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className={`w-full p-3 rounded-xl appearance-none text-sm font-medium focus:outline-none focus:ring-2 transition-all cursor-pointer bg-[#120a02] border border-rattanakosin-900 text-rattanakosin-50 focus:ring-rattanakosin-600 hover:bg-rattanakosin-900/40 shadow-lg`}
                 >
                    {Object.values(AspectRatio).map((r) => (
                      <option key={r} value={r} className="bg-[#120a02] text-rattanakosin-50">
                        {r === AspectRatio.SQUARE ? 'Square (1:1)' : 
                         r === AspectRatio.PORTRAIT_3_4 ? 'Portrait (3:4)' :
                         r === AspectRatio.LANDSCAPE_4_3 ? 'Landscape (4:3)' :
                         r === AspectRatio.PORTRAIT_9_16 ? 'Portrait (9:16)' :
                         r === AspectRatio.LANDSCAPE_16_9 ? 'Landscape (16:9)' : r}
                      </option>
                    ))}
                 </select>
                 <div className={`absolute right-3 top-3 pointer-events-none opacity-50 text-rattanakosin-gold`}>
                    ▼
                 </div>
               </div>
            </div>

            {/* VOICE TUNING CONFIG */}
            <div className="mb-4 border border-rattanakosin-gold/10 rounded-xl bg-[#120a02]/40 overflow-hidden">
              <button 
                type="button"
                onClick={() => setCustomPromptEnabled(!customPromptEnabled)}
                className="w-full p-3.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rattanakosin-gold hover:bg-rattanakosin-gold/5 transition-all text-left focus:outline-none cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-rattanakosin-gold animate-pulse" />
                  Voice Tuning & Presets
                </span>
                <span className="text-rattanakosin-gold/50">{customPromptEnabled ? '▲ Hide' : '▼ Tune Speech'}</span>
              </button>

              {customPromptEnabled && (
                <div className="p-4 sm:p-6 border-t border-rattanakosin-gold/10 space-y-4 sm:space-y-6 bg-[#0a0501]/80 animate-fade-in text-left">
                  {/* OPTIONAL STYLING ACTIVATE TOGGLE */}
                  <div className="p-4 sm:p-5 rounded-xl bg-rattanakosin-gold/5 border border-rattanakosin-gold/20 flex items-center justify-between gap-4">
                    <div className="space-y-1 sm:space-y-1.5">
                      <span className="block text-xs sm:text-sm font-bold text-rattanakosin-gold uppercase tracking-wider">
                        Apply Voice Styling & Pacing
                      </span>
                      <span className="block text-[10px] sm:text-xs text-rattanakosin-100/50 leading-tight font-mono">
                        {applyVoiceTuning ? "ACTIVE: Overriding with style preset prompt" : "OFF: Using standard natural voice (un-styled)"}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={applyVoiceTuning}
                        onChange={(e) => {
                          setApplyVoiceTuning(e.target.checked);
                          // Automatically set preset to match standard if they turn styling on
                          if (e.target.checked) {
                            const matchingPreset = VOICE_PRESETS.find(p => p.baseVoice === voiceName);
                            if (matchingPreset) {
                              setVoicePresetId(matchingPreset.id);
                              setCustomPrompt(matchingPreset.prompt);
                            }
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 sm:w-14 sm:h-7 bg-[#120a02] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-rattanakosin-gold/40 after:border-rattanakosin-gold/40 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-rattanakosin-600 peer-checked:after:bg-rattanakosin-gold border border-rattanakosin-gold/30"></div>
                    </label>
                  </div>

                  <p className="text-[11px] sm:text-xs text-[var(--color-rattanakosin-100)]/60 leading-relaxed font-mono">
                    Tuning presets adjust cadence, pacing, and accurate name pronunciations on top of your selected physical voice.
                  </p>

                  <div className="space-y-2 block duration-200" style={{ opacity: applyVoiceTuning ? 1 : 0.5 }}>
                    <label htmlFor="voicePresetSelect" className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-rattanakosin-100/50">
                      Style Character Preset
                    </label>
                    <div className="relative">
                      <select
                        id="voicePresetSelect"
                        name="voicePresetSelect"
                        value={voicePresetId}
                        disabled={!applyVoiceTuning}
                        onChange={(e) => handleVoicePresetChange(e.target.value)}
                        className="w-full p-3 sm:p-4 rounded-xl appearance-none text-sm sm:text-base font-semibold bg-[#120a02] border border-rattanakosin-900 text-rattanakosin-50 focus:outline-none focus:ring-2 focus:ring-rattanakosin-gold cursor-pointer disabled:cursor-not-allowed pr-10"
                      >
                        {VOICE_PRESETS.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#120a02]">
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-3 sm:top-4 pointer-events-none opacity-50 text-rattanakosin-gold text-xs sm:text-sm">
                        ▼
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 block duration-200" style={{ opacity: applyVoiceTuning ? 1 : 0.5 }}>
                    <div className="flex items-center justify-between">
                      <label htmlFor="voicePresetPrompt" className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-rattanakosin-100/50">
                        Pacing & Intonation Script
                      </label>
                      <button 
                        type="button"
                        disabled={!applyVoiceTuning}
                        onClick={() => {
                          const currentPreset = VOICE_PRESETS.find(p => p.id === voicePresetId);
                          if (currentPreset) setCustomPrompt(currentPreset.prompt);
                        }}
                        className="text-[10px] sm:text-xs text-rattanakosin-gold hover:underline font-semibold cursor-pointer disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
                        title="Restore preset standard instructions"
                      >
                        Reset Prompt
                      </button>
                    </div>
                    <textarea
                      id="voicePresetPrompt"
                      name="voicePresetPrompt"
                      value={customVoicePrompt}
                      disabled={!applyVoiceTuning}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full h-32 sm:h-40 p-3 sm:p-4 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-rattanakosin-gold bg-[#120a02] border border-rattanakosin-900 text-rattanakosin-50 disabled:cursor-not-allowed"
                      placeholder="Enter custom specifications for pronunciation, cadence, rhythm, tone or dramatic style..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TEXT INPUT AREA */}
            <div className="mb-4">
              <label htmlFor="topicInput" className={`block text-xs font-bold uppercase tracking-wider mb-2 text-rattanakosin-100/50`}>
                Contemplation Topic
              </label>
              <textarea
                id="topicInput"
                name="topicInput"
                className={`w-full h-36 p-4 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-all shadow-inner bg-[#120a02] border-rattanakosin-900 text-rattanakosin-50 focus:ring-rattanakosin-600 placeholder-rattanakosin-900`}
                placeholder={artStyle === ArtStyle.RATTANAKOSIN 
                  ? "Describe the vision... (e.g. 'The cycle of Samsara painted on a gallery wall')" 
                  : "Enter topic... (e.g. 'The 12 Links of Dependent Origination tabular breakdown')"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            {/* FILE UPLOAD */}
            <div className="mb-6">
              <label htmlFor="fileUpload" className={`block text-xs font-bold uppercase tracking-wider mb-2 text-rattanakosin-100/50`}>
                Source Material
              </label>
              
              {!attachment ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all text-center relative overflow-hidden border-rattanakosin-900 hover:border-rattanakosin-600 hover:bg-rattanakosin-900/30 bg-[#120a02]`}
                >
                  <input 
                    id="fileUpload"
                    name="fileUpload"
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.md,.json,.csv,.png,.jpg,.jpeg,.webp,.pdf"
                    onChange={handleFileUpload}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                     <div className={`p-2 rounded-full bg-rattanakosin-900 text-rattanakosin-500 group-hover:scale-110 transition-transform`}>
                        <Upload className="w-5 h-5" />
                     </div>
                     <div className="text-center">
                       <p className={`text-sm font-semibold text-rattanakosin-100`}>
                         Upload Sutta, PDF or Image
                       </p>
                     </div>
                  </div>
                </div>
              ) : (
                <div className={`flex items-center justify-between p-3 rounded-xl border bg-rattanakosin-900 border-rattanakosin-800`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className={`p-2 rounded-lg shrink-0 bg-black`}>
                       {attachment.type === 'image' 
                          ? <ImageIcon className="w-5 h-5 text-purple-500" />
                          : attachment.type === 'pdf'
                          ? <FileText className="w-5 h-5 text-red-500" />
                          : <ScrollText className="w-5 h-5 text-orange-600" />
                       }
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-medium truncate text-rattanakosin-50`}>
                          {attachment.name}
                        </span>
                     </div>
                  </div>
                  <button 
                    onClick={clearAttachment}
                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* BUTTON */}
            <button 
              onClick={handleRender}
              disabled={isLoading}
              className={`w-full relative group overflow-hidden flex items-center justify-center space-x-2 py-4 px-4 rounded-xl text-sm font-bold shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-rattanakosin-600 to-rattanakosin-800 text-white border border-rattanakosin-500/50 shadow-rattanakosin-900/50`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}/>
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}/>
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}/>
                </span>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span className="tracking-wide">{isNarrative ? 'GENERATE SLIDE DECK' : 'MANIFEST'}</span>
                </>
              )}
            </button>
          </div>

          {/* Agents */}
          <div className={`flex-1 rounded-2xl border p-4 min-h-[200px] bg-[#1e1205] border-rattanakosin-800`}>
             <div className="flex items-center justify-between mb-4 px-1">
               <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Experts Guild (Agentic Pipeline)</h3>
               <div className={`h-2 w-2 rounded-full ${isLoading ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
             </div>
             <div className="space-y-3">
                {agents.map(agent => (
                  <AgentBadge key={agent.id} agent={agent} />
                ))}
             </div>
          </div>
        </div>

          {/* Right Panel */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          {/* SLIDE CONTROLS */}
          {currentDiagrams.length > 1 && (
            <div className="flex items-center justify-between mb-4 px-4 py-2 rounded-xl bg-black/10 backdrop-blur-sm border border-white/10">
              <button 
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-sm font-bold font-mono tracking-widest">
                SLIDE {currentSlideIndex + 1} / {currentDiagrams.length}
              </span>
              <button 
                onClick={nextSlide}
                disabled={currentSlideIndex === currentDiagrams.length - 1}
                className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="relative w-full aspect-square sm:aspect-video lg:aspect-auto lg:h-[600px] mb-6">
            <DiagramCanvas 
              svgContent={currentDiagram?.svg || null}
              backgroundUrl={currentDiagram?.backgroundUrl}
              isLoading={isLoading}
              title={currentDiagram?.title}
              isDark={true}
              scriptType={currentDiagram?.scriptType}
              aspectRatio={aspectRatio}
              artStyle={artStyle}
            />
          </div>


          
          {/* Methodology / Comprehensive Lesson */}
          {currentDiagram && (
             <div className={`p-4 sm:p-8 rounded-2xl border animate-fade-in shadow-xl bg-[#1e1205]/90 border-rattanakosin-800 shadow-black/40`}>
                
                {/* Unified Download Hub */}
                <div className="mb-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-rattanakosin-800 pb-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-rattanakosin-gold" />
                      <h4 className="text-sm font-bold uppercase tracking-widest text-rattanakosin-gold/70">Download Hub</h4>
                    </div>
                    {currentDiagrams.length > 0 && (
                      <button 
                        onClick={handleDownloadAllAssets}
                        disabled={isZipping}
                        className="px-5 py-2.5 sm:px-6 sm:py-3 bg-rattanakosin-gold text-rattanakosin-950 font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-rattanakosin-300 transition-all rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-y-0.5 transition-transform" />
                        {isZipping ? 'ZIPPING...' : 'DOWNLOAD ALL FILES (ZIP)'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    
                    {/* Visual Exports */}
                    <div className="space-y-3">
                      <p className="text-[10px] sm:text-xs font-bold text-rattanakosin-100/40 uppercase tracking-tighter">Visual Exports</p>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={handleDownloadSVG}
                          className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold group"
                        >
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">SVG Vector</span>
                          </div>
                          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Scalable</span>
                        </button>
                        <button 
                          onClick={downloadPng}
                          className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold group"
                        >
                          <div className="flex items-center gap-2">
                            <FileImage className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Master PNG</span>
                          </div>
                          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Art + Text</span>
                        </button>
                        {currentDiagram?.backgroundUrl && (
                          <button 
                            onClick={downloadBgArt}
                            className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold group"
                          >
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="text-xs font-bold uppercase tracking-widest">BG Art Only</span>
                            </div>
                            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">No Text</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Exports */}
                    <div className="space-y-3">
                      <p className="text-[10px] sm:text-xs font-bold text-rattanakosin-100/40 uppercase tracking-tighter">Content & Text</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => downloadDescription('md')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold"
                          >
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Markdown</span>
                          </button>
                          <button 
                            onClick={() => copyDescription('md')}
                            className="px-4 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold"
                            title="Copy MD"
                          >
                            {isCopiedMd ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                        <button 
                          onClick={handleShare}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-600 hover:bg-rattanakosin-500 transition-all text-white shadow-lg"
                        >
                          {isShared ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                          <span className="text-xs font-bold uppercase tracking-widest">{isShared ? 'COPIED LINK' : 'SHARE CREATION'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Media Exports */}
                    <div className="space-y-3">
                      <p className="text-[10px] sm:text-xs font-bold text-rattanakosin-100/40 uppercase tracking-tighter">Media & Audio</p>
                      <div className="flex flex-col gap-2">
                        {audioErrorMessage && (
                          <div className="p-3 bg-red-950/80 border border-red-700/60 rounded-lg text-xs text-red-200 flex items-start justify-between gap-2 shadow-inner">
                            <span className="leading-relaxed">{audioErrorMessage}</span>
                            <button 
                              onClick={() => setAudioErrorMessage(null)} 
                              className="text-red-400 hover:text-white font-bold text-xs uppercase underline shrink-0 ml-2"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}

                        {isNarrative ? (
                          <div className="flex flex-col gap-2">
                            {/* Slide-specific Audio */}
                            {!currentDiagram?.audioUrl ? (
                              <button 
                                onClick={() => handleGenerateAudio('current')}
                                disabled={isGeneratingAudio}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg bg-amber-600 hover:bg-amber-500 transition-all text-white shadow-lg disabled:opacity-50"
                              >
                                {isGeneratingAudio ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                                <span className="text-xs font-bold uppercase tracking-widest">
                                  {isGeneratingAudio ? (audioProgressText || 'GENERATING AUDIO...') : `GENERATE AUDIO (SLIDE ${currentSlideIndex + 1})`}
                                </span>
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => downloadAudio('mp3', 'current')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold"
                                  >
                                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">DOWNLOAD MP3 (SLIDE {currentSlideIndex + 1})</span>
                                  </button>
                                  <button
                                    onClick={() => handleGenerateAudio('current')}
                                    disabled={isGeneratingAudio}
                                    title="Regenerate speech for this slide"
                                    className="px-3 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold/70 hover:text-rattanakosin-gold disabled:opacity-50"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Batch Narrative Audio Button */}
                            {currentDiagrams.length > 1 && (
                              <div className="flex flex-col gap-1.5 pt-1">
                                <button 
                                  onClick={() => handleGenerateAudio('all')}
                                  disabled={isGeneratingAudio}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rattanakosin-900/60 border border-amber-600/40 hover:bg-amber-900/30 hover:border-amber-500 transition-all text-amber-200 shadow disabled:opacity-50"
                                >
                                  {isGeneratingAudio && audioProgressText?.startsWith('Slide') ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                  ) : (
                                    <Mic className="w-4 h-4 text-amber-400" />
                                  )}
                                  <span className="text-[11px] font-bold uppercase tracking-wider">
                                    {isGeneratingAudio && audioProgressText?.startsWith('Slide')
                                      ? audioProgressText
                                      : `GENERATE ALL SLIDES AUDIO (${currentDiagrams.filter(d => d.audioUrl).length}/${currentDiagrams.length} READY)`}
                                  </span>
                                </button>
                                {currentDiagrams.some(d => d.audioUrl) && (
                                  <button 
                                    onClick={() => downloadAudio('mp3', 'merged')}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-rattanakosin-950/40 border border-rattanakosin-800/60 hover:bg-rattanakosin-800/40 transition-all text-rattanakosin-gold/80 hover:text-rattanakosin-gold text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>DOWNLOAD ALL SLIDES (MERGED MP3)</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Video Section for Current Slide */}
                            {currentDiagram?.audioUrl && (
                              !currentDiagram?.videoUrl ? (
                                <div className="space-y-2 pt-2 border-t border-rattanakosin-800/50">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs uppercase font-bold text-rattanakosin-gold bg-rattanakosin-900/30 p-2 sm:p-3 rounded-lg border border-rattanakosin-800/50">
                                    <span>Video Visuals:</span>
                                    <select 
                                      value={videoVisualMode} 
                                      onChange={(e) => setVideoVisualMode(e.target.value as 'master' | 'bg_only')}
                                      className="bg-black/50 border border-rattanakosin-800 rounded px-2 py-1.5 text-rattanakosin-100 focus:outline-none focus:border-rattanakosin-gold w-full sm:w-auto"
                                    >
                                      <option value="master">Infographic (Text + Art)</option>
                                      <option value="bg_only">Background Art Only</option>
                                    </select>
                                  </div>
                                  <button 
                                    onClick={handleGenerateVideo}
                                    disabled={isGeneratingVideo}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg bg-amber-600 hover:bg-amber-500 transition-all text-white shadow-lg disabled:opacity-50"
                                  >
                                    {isGeneratingVideo ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    <span className="text-xs font-bold uppercase tracking-widest">GENERATE VIDEO</span>
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={downloadVideo}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg bg-green-600 hover:bg-green-500 transition-all text-white shadow-lg"
                                >
                                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span className="text-xs font-bold uppercase tracking-widest">DOWNLOAD VIDEO</span>
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          // Studio / Single View
                          !currentDiagram?.audioUrl ? (
                            <button 
                              onClick={() => handleGenerateAudio('current')}
                              disabled={isGeneratingAudio}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg bg-amber-600 hover:bg-amber-500 transition-all text-white shadow-lg disabled:opacity-50"
                            >
                              {isGeneratingAudio ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                              <span className="text-xs font-bold uppercase tracking-widest">{isGeneratingAudio ? (audioProgressText || 'GENERATING AUDIO...') : 'GENERATE AUDIO'}</span>
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => downloadAudio('mp3', 'current')}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold"
                                >
                                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span className="text-xs font-bold uppercase tracking-widest">DOWNLOAD AUDIO (MP3)</span>
                                </button>
                                <button
                                  onClick={() => handleGenerateAudio('current')}
                                  disabled={isGeneratingAudio}
                                  title="Regenerate speech"
                                  className="px-3 py-2.5 sm:py-3 rounded-lg bg-rattanakosin-900/50 border border-rattanakosin-800 hover:bg-rattanakosin-800 transition-all text-rattanakosin-gold/70 hover:text-rattanakosin-gold disabled:opacity-50"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              </div>
                              {!currentDiagram?.videoUrl ? (
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs uppercase font-bold text-rattanakosin-gold bg-rattanakosin-900/30 p-2 sm:p-3 rounded-lg border border-rattanakosin-800/50">
                                    <span>Video Visuals:</span>
                                    <select 
                                      value={videoVisualMode} 
                                      onChange={(e) => setVideoVisualMode(e.target.value as 'master' | 'bg_only')}
                                      className="bg-black/50 border border-rattanakosin-800 rounded px-2 py-1.5 text-rattanakosin-100 focus:outline-none focus:border-rattanakosin-gold w-full sm:w-auto"
                                    >
                                      <option value="master">Infographic (Text + Art)</option>
                                      <option value="bg_only">Background Art Only</option>
                                    </select>
                                  </div>
                                  <button 
                                    onClick={handleGenerateVideo}
                                    disabled={isGeneratingVideo}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg bg-amber-600 hover:bg-amber-500 transition-all text-white shadow-lg disabled:opacity-50"
                                  >
                                    {isGeneratingVideo ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    <span className="text-xs font-bold uppercase tracking-widest">GENERATE VIDEO</span>
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={downloadVideo}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg bg-green-600 hover:bg-green-500 transition-all text-white shadow-lg"
                                >
                                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span className="text-xs font-bold uppercase tracking-widest">DOWNLOAD VIDEO</span>
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b pb-4 mb-6 border-rattanakosin-800`}>
                  <h4 className={`text-lg font-bold uppercase tracking-widest flex items-center gap-3 text-rattanakosin-gold whitespace-nowrap`}>
                    <FileText className="w-5 h-5" />
                    {currentDiagram.contextTitle || (artStyle === ArtStyle.RATTANAKOSIN ? 'Dhammic Context' : 'Academic Breakdown')}
                  </h4>
                </div>

                <div className={`text-base leading-relaxed text-rattanakosin-100 font-serif`}>
                  <div className="markdown-body prose prose-invert prose-rattanakosin max-w-none space-y-8">
                    {currentDiagram.story_text ? (
                      <section>
                        <h5 className="text-rattanakosin-gold font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                          <ScrollText className="w-4 h-4" /> Narrative
                        </h5>
                        <div className="bg-black/20 p-6 rounded-xl border border-rattanakosin-gold/10 leading-relaxed">
                          <Markdown rehypePlugins={[rehypeRaw]}>{currentDiagram.story_text}</Markdown>
                        </div>
                      </section>
                    ) : (
                      <Markdown rehypePlugins={[rehypeRaw]}>{currentDiagram.description}</Markdown>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

      {/* Advanced Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#1e1205] border border-rattanakosin-gold/30 shadow-2xl text-left space-y-6">
            <button 
              onClick={() => {
                setStoredTextModel(textModelOverride || 'gemini-2.5-flash');
                setStoredTtsModel(ttsModelOverride || 'gemini-3.1-flash-tts-preview');
                setShowSettingsModal(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#120a02] hover:bg-rattanakosin-gold/10 text-rattanakosin-gold hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <div className="flex items-center gap-4 border-b border-rattanakosin-gold/10 pb-4">
              <div className="p-3 rounded-full bg-rattanakosin-900 border border-rattanakosin-gold/20">
                <Settings className="w-8 h-8 text-rattanakosin-gold" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-rattanakosin-gold tracking-tight">Model Config</h2>
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-rattanakosin-100/50 font-mono">Future-Proof AI Engine Overrides</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-rattanakosin-gold">Text & Logic Model (Brain)</label>
                <input 
                  type="text"
                  value={textModelOverride}
                  onChange={(e) => setTextModelOverride(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#120a02] border border-rattanakosin-900 text-rattanakosin-50 focus:outline-none focus:ring-2 focus:ring-rattanakosin-gold font-mono text-sm sm:text-base border-2"
                  placeholder="e.g. gemini-2.5-flash"
                />
                <p className="text-xs text-rattanakosin-100/50">Overrides the core model used for generation, logic, and reasoning.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-rattanakosin-gold">Text-To-Speech Model (Voice)</label>
                <input 
                  type="text"
                  value={ttsModelOverride}
                  onChange={(e) => setTtsModelOverride(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#120a02] border border-rattanakosin-900 text-rattanakosin-50 focus:outline-none focus:ring-2 focus:ring-rattanakosin-gold font-mono text-sm sm:text-base border-2"
                  placeholder="e.g. gemini-3.1-flash-tts-preview"
                />
                <p className="text-xs text-rattanakosin-100/50">Native text-to-speech model. Default: <span className="text-white font-mono">gemini-3.1-flash-tts-preview</span>.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-rattanakosin-gold/10 flex justify-end">
              <button 
                onClick={() => {
                  setStoredTextModel(textModelOverride || 'gemini-2.5-flash');
                  setStoredTtsModel(ttsModelOverride || 'gemini-3.1-flash-tts-preview');
                  setShowSettingsModal(false);
                }}
                className="px-6 py-3 rounded-xl bg-rattanakosin-600 hover:bg-rattanakosin-500 transition-colors text-white font-bold text-xs sm:text-sm uppercase tracking-widest cursor-pointer shadow-lg"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authors & Collaborators Modal */}
      {showCollaboratorsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-xl p-8 rounded-2xl bg-[#1e1205] border border-rattanakosin-gold/30 shadow-2xl text-left space-y-6 max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setShowCollaboratorsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#120a02] hover:bg-rattanakosin-gold/10 text-rattanakosin-gold hover:text-white transition-all cursor-pointer"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-rattanakosin-gold/10">
              <div className="p-2 rounded-full bg-rattanakosin-600 text-white shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-rattanakosin-gold">Authors & Collaborators</h3>
                <p className="text-[10px] font-mono tracking-wider uppercase text-rattanakosin-100/40">Credits & Attribution Portal</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Primary Author */}
              <div className="space-y-2">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-rattanakosin-gold/60">Primary Author & Visionary</p>
                <div className="p-4 rounded-xl bg-[#120a02] border border-rattanakosin-gold/15 space-y-2">
                  <h4 className="text-sm font-bold text-rattanakosin-gold">Ajarn Spencer Littlewood</h4>
                  <p className="text-xs text-rattanakosin-100/70 leading-relaxed">
                    Scholarly research, art direction, and publisher of 
                    <a href="https://www.buddhamagic.net" target="_blank" rel="noopener noreferrer" className="mx-1 text-rattanakosin-gold hover:underline">Buddha Magic Multimedia and Publications</a>. 
                    Specialist in traditional aesthetics, ancient alphabets, and sacred designs.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-[10px] font-mono">
                    <a href="https://www.ajarnspencer.com" target="_blank" rel="noopener noreferrer" className="text-rattanakosin-gold hover:underline flex items-center gap-1">
                      🌐 ajarnspencer.com
                    </a>
                    <a href="https://github.com/AjarnSpencer" target="_blank" rel="noopener noreferrer" className="text-rattanakosin-gold hover:underline flex items-center gap-1">
                      🐙 GitHub Profile
                    </a>
                  </div>
                </div>
              </div>

              {/* Technologies & Open-Source Collaborations */}
              <div className="space-y-2">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-rattanakosin-gold/60">Open Source Collaborations & Solutions</p>
                <div className="p-4 rounded-xl bg-[#120a02]/60 border border-rattanakosin-gold/5 space-y-3 text-xs text-rattanakosin-100/80">
                  <p className="leading-relaxed text-[11px] text-rattanakosin-100/60">
                    This offline-ready premium application brings together cutting-edge web engineering and artificial intelligence utilities, powered by the following free open-source achievements:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-mono pt-1 text-rattanakosin-100/70">
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> React 18 & Vite</li>
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> Tailwind CSS</li>
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> @google/genai</li>
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> JSZip Compressor</li>
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> Lucide-React Icons</li>
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> Recharts & D3</li>
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> LameJS MP3 Studio</li>
                    <li className="flex items-center gap-1.5"><span className="text-rattanakosin-gold">✦</span> Framer Motion Hooks</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-rattanakosin-gold/10 flex justify-end">
              <button 
                onClick={() => setShowCollaboratorsModal(false)}
                className="px-5 py-2.5 rounded-lg bg-rattanakosin-600 hover:bg-rattanakosin-500 transition-colors text-white font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg animate-pulse"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Credits */}
      <footer className="w-full border-t border-rattanakosin-800 bg-[#1a1005] py-6 px-4 text-center z-10 relative">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-xs font-mono tracking-widest text-rattanakosin-gold/70 uppercase">
            Created by <a href="https://www.ajarnspencer.com" target="_blank" rel="noopener noreferrer" className="text-rattanakosin-gold hover:text-white transition-colors">Ajarn Spencer Littlewood</a>
          </p>
          <p className="text-[10px] font-mono tracking-wider text-rattanakosin-100/50">
            Publisher: <a href="https://www.buddhamagic.net" target="_blank" rel="noopener noreferrer" className="hover:text-rattanakosin-gold transition-colors">Buddha Magic Multimedia and Publications</a>
          </p>
          <p className="text-[10px] font-mono tracking-wider text-rattanakosin-100/50">
            GitHub: <a href="https://github.com/AjarnSpencer" target="_blank" rel="noopener noreferrer" className="hover:text-rattanakosin-gold transition-colors">github.com/AjarnSpencer</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
