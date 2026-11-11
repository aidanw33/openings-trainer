export interface Preview { fens: string[]; sans: string[]; cursor: number }
export function VariationPreview({ preview, onStep, onClose }: { preview: Preview; onStep: (n: number) => void; onClose: () => void }) {
  return <div className="variation-preview"><div><b>Engine variation</b><span className="small">{preview.cursor ? preview.sans[preview.cursor - 1] : 'Starting position'} · {preview.cursor}/{preview.sans.length}</span></div><button aria-label="Previous preview move" disabled={!preview.cursor} onClick={() => onStep(preview.cursor - 1)}>←</button><button aria-label="Next preview move" disabled={preview.cursor === preview.sans.length} onClick={() => onStep(preview.cursor + 1)}>→</button><button onClick={onClose}>Close</button></div>;
}
