# Agent Instructions for Omni Content Creator

## Infographic Composition Rules
- **Simplicity**: Info-Graphics should be short and simple and not over-cram the canvas.
- **Text Layout**: All text in infographics must be full width with some padding top bottom left and right respectively.
- **Text Wrapping**: The text must wrap within its container-background. This prevents text from overstepping borders and ensures it fills the container width appropriately.

## Technical Implementation
- **Prompt Engineering**: The `systemInstruction` in `services/geminiService.ts` has been updated with a "FULL WIDTH MANDATE" and "TEXT WRAPPING" instructions to ensure the LLM generates SVG with appropriate layout.
- **SVG Sanitization**: `components/DiagramCanvas.tsx` contains logic to sanitize the SVG, deduplicate text, and ensure transparency.
- **Font Stacks**: Multi-script support is handled via `getFontStack` in `DiagramCanvas.tsx` and specific font instructions in the LLM prompt.
