import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/** A "Learn More" button that opens admin-editable help content for a module. */
export function LearnMore({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  if (!content?.trim()) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <HelpCircle className="h-4 w-4" /> Learn More
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
