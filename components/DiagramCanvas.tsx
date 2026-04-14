import React, { useRef, useState, useMemo } from 'react';
import { Download, Share2, Image as ImageIcon, FileImage, Loader2 } from 'lucide-react';
import { ScriptType, AspectRatio, getDimensions, ArtStyle } from '../types';

interface DiagramCanvasProps {
  svgContent: string | null;
  backgroundUrl?: string;
  isLoading: boolean;
  title?: string;
  isDark: boolean; 
  scriptType?: ScriptType;
  aspectRatio?: AspectRatio;
  artStyle?: ArtStyle;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ 
  svgContent, 
  backgroundUrl, 
  isLoading, 
  title, 
  isDark, 
  scriptType,
  aspectRatio = AspectRatio.PORTRAIT_3_4,
  artStyle
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { width, height } = getDimensions(aspectRatio);

  const getFontStack = (script?: ScriptType) => {
    switch (script) {
      case ScriptType.THAI:
      case ScriptType.PALI_THAI: return "'Sarabun', 'Noto Sans Thai', sans-serif";
      case ScriptType.KHOM: return "'Moul', 'Noto Sans Khmer', serif";
      case ScriptType.LAO: return "'Noto Sans Lao', sans-serif";
      case ScriptType.TIBETAN: return "'Noto Sans Tibetan', sans-serif";
      case ScriptType.CHINESE_SIMPLIFIED:
      case ScriptType.CHINESE_TRADITIONAL: return "'Noto Sans SC', sans-serif";
      case ScriptType.JAPANESE: return "'Noto Sans JP', sans-serif";
      case ScriptType.KOREAN: return "'Noto Sans KR', sans-serif";
      case ScriptType.ARABIC:
      case ScriptType.PERSIAN:
      case ScriptType.URDU: return "'Noto Sans Arabic', sans-serif";
      case ScriptType.HINDI:
      case ScriptType.SANSKRIT: return "'Noto Sans Devanagari', sans-serif";
      case ScriptType.BENGALI: return "'Noto Sans Bengali', sans-serif";
      case ScriptType.TAMIL: return "'Noto Sans Tamil', sans-serif";
      case ScriptType.TELUGU: return "'Noto Sans Telugu', sans-serif";
      case ScriptType.KANNADA: return "'Noto Sans Kannada', sans-serif";
      case ScriptType.MALAYALAM: return "'Noto Sans Malayalam', sans-serif";
      case ScriptType.GUJARATI: return "'Noto Sans Gujarati', sans-serif";
      case ScriptType.GURMUKHI: return "'Noto Sans Gurmukhi', sans-serif";
      case ScriptType.SINHALA:
      case ScriptType.PALI_SINHALA: return "'Noto Sans Sinhala', sans-serif";
      case ScriptType.BURMESE:
      case ScriptType.PALI_BURMESE: return "'Noto Sans Myanmar', sans-serif";
      case ScriptType.AMHARIC: return "'Noto Sans Ethiopic', sans-serif";
      case ScriptType.ARMENIAN: return "'Noto Sans Armenian', sans-serif";
      case ScriptType.GEORGIAN: return "'Noto Sans Georgian', sans-serif";
      case ScriptType.MONGOLIAN: return "'Noto Sans Mongolian', sans-serif";
      case ScriptType.SYRIAC: return "'Noto Sans Syriac', sans-serif";
      case ScriptType.GREEK: return "'Noto Sans Greek', sans-serif";
      case ScriptType.HEBREW: return "'Noto Sans Hebrew', sans-serif";
      case ScriptType.RUSSIAN:
      case ScriptType.BULGARIAN:
      case ScriptType.POLISH:
      case ScriptType.ROMANIAN: return "'Noto Sans', sans-serif";
      default: 
        if (artStyle === ArtStyle.NEOLITHIC_ART || artStyle === ArtStyle.GEOGLYPH_ART || artStyle === ArtStyle.AFRICAN_TRADITIONAL || artStyle === ArtStyle.POLYNESIAN_TATAU) {
          return "'Bungee', 'Inter', sans-serif"; // More blocky/primitive feel
        }
        if (artStyle === ArtStyle.MEDIEVAL_ART || artStyle === ArtStyle.RENAISSANCE_ART || artStyle === ArtStyle.STAINED_GLASS || artStyle === ArtStyle.CHARCOAL_RENAISSANCE || artStyle === ArtStyle.HISTORICAL_BIBLICAL) {
          return "'Cinzel', 'Libre Baskerville', serif";
        }
        if (artStyle === ArtStyle.ART_NOUVEAU || artStyle === ArtStyle.WATERCOLOR || artStyle === ArtStyle.IMPRESSIONIST) {
          return "'Playfair Display', serif";
        }
        if (artStyle === ArtStyle.SCI_FI || artStyle === ArtStyle.HACKER_MATRIX || artStyle === ArtStyle.SYNTHWAVE || artStyle === ArtStyle.GLITCH_ART || artStyle === ArtStyle.PIXEL_ART) {
          return "'Share Tech Mono', 'Courier New', monospace";
        }
        if (artStyle === ArtStyle.COMIC_STRIP || artStyle === ArtStyle.MANGA || artStyle === ArtStyle.MANGA_MODERN) {
          return "'Bangers', 'Comic Sans MS', cursive";
        }
        return "'Cinzel', 'Inter', sans-serif";
    }
  };

  const injectStylesAndPrepare = (svgStr: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    if (!svgElement) return null;

    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    if (!svgElement.getAttribute("viewBox")) {
      svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
    // Safer way to set style if the property is missing on the parsed element
    if ('style' in svgElement && (svgElement as any).style) {
      (svgElement as any).style.background = "transparent";
    } else {
      svgElement.setAttribute("style", "background: transparent");
    }

    const style = doc.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Sarabun:wght@400;600;800&family=Moul&family=Noto+Sans+Lao&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Tibetan:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Telugu:wght@400;700&family=Noto+Sans+Kannada:wght@400;700&family=Noto+Sans+Malayalam:wght@400;700&family=Noto+Sans+Gujarati:wght@400;700&family=Noto+Sans+Gurmukhi:wght@400;700&family=Noto+Sans+Sinhala:wght@400;700&family=Noto+Sans+Myanmar:wght@400;700&family=Noto+Sans+Ethiopic:wght@400;700&family=Noto+Sans+Armenian:wght@400;700&family=Noto+Sans+Georgian:wght@400;700&family=Noto+Sans+Mongolian&family=Noto+Sans+Syriac&family=Noto+Sans+Greek:wght@400;700&family=Noto+Sans+Hebrew:wght@400;700&family=Noto+Sans:wght@400;700&family=Noto+Sans+Thai:wght@400;700&family=Bungee&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
      svg { font-family: ${getFontStack(scriptType)}; background: transparent !important; }
      text { 
        font-family: ${getFontStack(scriptType)} !important; 
        font-weight: 700 !important;
        paint-order: stroke fill !important;
        stroke-width: 0.5px !important;
        stroke-linejoin: round !important;
      }
      * { stroke-dasharray: none !important; }
    `;
    
    let defs = svgElement.querySelector("defs");
    if (!defs) {
      defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgElement.insertBefore(defs, svgElement.firstChild);
    }
    defs.appendChild(style);

    // NUCLEAR OPTION: Sanitize unwanted elements
    
    // 1. Destroy technical lines
    const technicalElements = svgElement.querySelectorAll("line, polyline, polygon, circle, ellipse, path");
    technicalElements.forEach(el => {
      if (el.tagName.toLowerCase() !== 'path') {
        el.remove();
      } else {
        // For paths, remove them completely unless they are inside a <defs> or <clipPath>
        // because the text model should only generate <text> and <rect> for layout.
        const parent = el.closest('defs, clipPath');
        if (!parent) {
          el.remove();
        }
      }
    });

    // 2. Destroy arrows and markers
    const markers = svgElement.querySelectorAll("marker");
    markers.forEach(el => el.remove());
    
    // 3. Destroy dotted lines and arrow attributes on ALL elements
    const allElements = svgElement.querySelectorAll("*");
    allElements.forEach(el => {
      el.removeAttribute("stroke-dasharray");
      el.removeAttribute("marker-start");
      el.removeAttribute("marker-mid");
      el.removeAttribute("marker-end");
      // Remove filters which can cause blurring/shadows
      el.removeAttribute("filter");
    });

    // 3.5 Remove all <filter> definitions
    const filters = svgElement.querySelectorAll("filter");
    filters.forEach(el => el.remove());

    // 3.6 Deduplicate text elements (fix for double text/shadows)
    const textElements = Array.from(svgElement.querySelectorAll("text"));
    const textContentMap = new Map<string, Element>();
    
    // First pass: identify duplicates
    textElements.forEach(el => {
      const content = el.textContent?.trim();
      if (!content) return;
      
      // Create a key based on content and approximate position (to distinguish different labels)
      // We use a loose position check (within 10px) to catch shadow offsets
      const x = parseFloat(el.getAttribute("x") || "0");
      const y = parseFloat(el.getAttribute("y") || "0");
      const key = `${content}-${Math.round(x / 10)}-${Math.round(y / 10)}`; // Bucket by 10px regions
      
      if (textContentMap.has(key)) {
        // We found a duplicate. 
        // Heuristic: Keep the one with the "lighter" fill (foreground) or the one defined later (painter's algo).
        // The prompt mandates #fefce8 or #fbbf24 for text.
        const currentFill = el.getAttribute("fill");
        const prevEl = textContentMap.get(key)!;
        const prevFill = prevEl.getAttribute("fill");
        
        const isCurrentForeground = currentFill === "#fefce8" || currentFill === "#fbbf24" || currentFill === "#FEFCE8" || currentFill === "#FBBF24";
        const isPrevForeground = prevFill === "#fefce8" || prevFill === "#fbbf24" || prevFill === "#FEFCE8" || prevFill === "#FBBF24";

        if (isCurrentForeground && !isPrevForeground) {
          // Current is better, remove previous
          prevEl.remove();
          textContentMap.set(key, el);
        } else if (!isCurrentForeground && isPrevForeground) {
          // Previous is better, remove current
          el.remove();
        } else {
          // Both are same "quality", remove the previous one (assume current is overlay)
          prevEl.remove();
          textContentMap.set(key, el);
        }
      } else {
        textContentMap.set(key, el);
      }
    });

    // 3.7 Sanitize text stroke width
    textElements.forEach(el => {
        // If the element is still in the DOM (wasn't removed)
        if (el.parentNode) {
            // Force a reasonable stroke width or remove it if it's too thick
            // We'll set it to a small relative value
            if ('style' in el && (el as any).style) {
                (el as any).style.strokeWidth = "0.5px";
            }
            el.setAttribute("stroke-width", "0.5");
        }
    });

    // 4. Destroy outer frames and background rects
    const rects = svgElement.querySelectorAll("rect");
    rects.forEach(rect => {
      const w = rect.getAttribute("width");
      const h = rect.getAttribute("height");
      const x = rect.getAttribute("x");
      const y = rect.getAttribute("y");
      
      // Check for full size rects or nearly full size rects (outer frames)
      const isFullWidth = w === "100%" || w === width.toString() || (w && parseInt(w) > width * 0.9);
      const isFullHeight = h === "100%" || h === height.toString() || (h && parseInt(h) > height * 0.9);
      const isAtOrigin = (!x || x === "0" || (x && parseInt(x) < 50)) && (!y || y === "0" || (y && parseInt(y) < 50));

      if (isFullWidth && isFullHeight && isAtOrigin) {
        // This is a background rect, remove it to ensure transparency
        rect.remove();
      } else {
        // For text containers, remove any strokes/borders that might look "technical"
        rect.removeAttribute("stroke");
        rect.removeAttribute("stroke-width");
      }
    });

    return { doc, svgElement };
  };

  const processedSvgContent = useMemo(() => {
    if (!svgContent) return null;
    const prepared = injectStylesAndPrepare(svgContent);
    if (!prepared) return svgContent;
    const { doc } = prepared;
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }, [svgContent, scriptType, aspectRatio]);

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const prepared = injectStylesAndPrepare(svgContent);
    if (!prepared) return;
    const { doc, svgElement } = prepared;

    if (backgroundUrl) {
      const image = doc.createElementNS("http://www.w3.org/2000/svg", "image");
      image.setAttribute("href", backgroundUrl);
      image.setAttribute("width", width.toString());
      image.setAttribute("height", height.toString());
      image.setAttribute("preserveAspectRatio", "xMidYMid slice");
      svgElement.insertBefore(image, svgElement.firstChild);

      // Add 20% Dark Maroon tint overlay
      const tint = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
      tint.setAttribute("width", width.toString());
      tint.setAttribute("height", height.toString());
      tint.setAttribute("fill", "#2a0a0a");
      tint.setAttribute("opacity", "0.2");
      // Insert after image so it overlays the background but sits behind the content
      svgElement.insertBefore(tint, image.nextSibling);
    }

    const serializer = new XMLSerializer();
    const content = serializer.serializeToString(doc);
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'omni-content-canvas'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    if (!svgContent) return;
    setIsExporting(true);

    try {
      const prepared = injectStylesAndPrepare(svgContent);
      if (!prepared) throw new Error("SVG preparation failed");
      const { doc } = prepared;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) throw new Error("Canvas context init failed");

      if (backgroundUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = () => {
            console.warn("Background image failed to load for PNG export, using fallback color.");
            ctx.fillStyle = isDark ? '#1a1005' : '#fdfbf7';
            ctx.fillRect(0, 0, width, height);
            resolve(null);
          };
          bgImg.src = backgroundUrl;
        });
        if (bgImg.complete && bgImg.naturalWidth > 0) {
          ctx.drawImage(bgImg, 0, 0, width, height);
          // Add 20% Dark Maroon tint as requested
          ctx.fillStyle = 'rgba(42, 10, 10, 0.2)'; 
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        ctx.fillStyle = isDark ? '#1a1005' : '#fdfbf7';
        ctx.fillRect(0, 0, width, height);
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(doc);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const svgImg = new Image();
      await new Promise((resolve, reject) => {
        svgImg.onload = resolve;
        svgImg.onerror = reject;
        svgImg.src = url;
      });

      await new Promise(r => setTimeout(r, 200));
      ctx.drawImage(svgImg, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${title || 'omni-content-export'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("PNG Master Export Failed:", err);
      alert("PNG Export Error: Please use 'Download SVG' instead.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBackground = async () => {
    if (!backgroundUrl) return;
    
    try {
      // If it's already a data URL, we can just download it
      if (backgroundUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = backgroundUrl;
        link.download = `${title || 'visual-art'}-background.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Otherwise, fetch it as a blob to force download
      const response = await fetch(backgroundUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'visual-art'}-background.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Background art download failed:", err);
      // Fallback: try direct link if fetch fails (e.g. CORS)
      const link = document.createElement('a');
      link.href = backgroundUrl;
      link.target = "_blank"; // At least open in new tab if download fails
      link.download = `${title || 'visual-art'}-background.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const displayAspectRatio = aspectRatio.replace(':', '/');

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border transition-all duration-500 shadow-2xl
      ${isDark ? 'bg-black border-rattanakosin-800 shadow-black/60' : 'bg-scholastic-50 border-scholastic-300 shadow-scholastic-100'}`}>
      
      {backgroundUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={backgroundUrl} 
            className="w-full h-full object-cover opacity-90 transition-opacity duration-1000" 
            alt="Visual Mural" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[#2a0a0a] opacity-35 backdrop-blur-[0.5px]" />
        </div>
      )}

      <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 
        ${isDark ? 'bg-black/60 text-rattanakosin-gold border-b border-rattanakosin-900/50' : 'bg-white/60 text-scholastic-900 border-b border-scholastic-200'} backdrop-blur-md`}>
        <div className="flex flex-col flex-1 min-w-0 pr-4">
          <h3 className="font-display text-sm font-bold tracking-widest truncate">
            {title || 'Visual Masterpiece'}
          </h3>
          <span className="text-[9px] opacity-60 uppercase font-mono tracking-tighter truncate">
             {width}x{height} HI-RES // VISUAL SCRIPTURE INSCRIBED
          </span>
        </div>
      </div>

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-12">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-6 bg-black/50 p-12 rounded-full backdrop-blur-xl border border-white/10">
            <div className={`w-24 h-24 border-4 border-double rounded-full animate-spin
              ${isDark ? 'border-rattanakosin-gold border-t-transparent' : 'border-scholastic-500 border-t-transparent'}`} />
            <p className="text-sm font-serif italic text-white tracking-widest uppercase">Generating content...</p>
          </div>
        ) : svgContent ? (
          <div 
            className="w-full h-full flex items-center justify-center svg-container drop-shadow-2xl"
            style={{ 
              aspectRatio: displayAspectRatio, 
              fontFamily: getFontStack(scriptType),
              maxHeight: '88vh'
            }}
            dangerouslySetInnerHTML={{ __html: processedSvgContent || '' }} 
          />
        ) : (
          <div className="text-center group">
             <ImageIcon className="w-16 h-16 mx-auto text-white/20 mb-4" />
             <p className="font-serif italic text-white/40 tracking-wider">Awaiting Topic...</p>
          </div>
        )}
      </div>

      <div className={`absolute bottom-6 right-6 text-[10px] uppercase tracking-[0.3em] font-mono pointer-events-none select-none z-20
        ${isDark ? 'text-rattanakosin-gold opacity-40' : 'text-scholastic-900 opacity-20'}`}>
        OMNI-CONTENT CREATOR // HI-FIDELITY CANVASSING
      </div>
    </div>
  );
};
