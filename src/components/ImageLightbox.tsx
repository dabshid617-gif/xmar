import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function ImageLightbox({ images, index, open, onClose, onPrev, onNext }: Props) {
  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onPrev, onNext]);

  const img = images[index];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[90vw] p-0 bg-black/90 border-0">
        <div className="relative w-full h-[70vh] sm:h-[80vh] flex items-center justify-center">
          <img src={img} alt="preview" className="max-h-full max-w-full object-contain" />
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-white hover:bg-white/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          {images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={onPrev}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={onNext}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <img key={i} src={src} alt={`thumb-${i}`} className={`h-14 w-14 object-cover rounded border ${i===index?'border-primary':'border-white/20'}`} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

