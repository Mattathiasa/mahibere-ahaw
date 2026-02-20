import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';

const searchItems = [
  { title: 'Dashboard', href: '/', category: 'Pages' },
  { title: 'Announcements', href: '/announcements', category: 'Pages' },
  { title: 'Plans', href: '/plans', category: 'Pages' },
  { title: 'Reports', href: '/reports', category: 'Pages' },
  { title: 'Members', href: '/members', category: 'Pages' },
  { title: 'Meetings', href: '/meetings', category: 'Pages' },
  { title: 'HigeDenb', href: '/hige-denb', category: 'Pages' },
  { title: 'Settings', href: '/settings', category: 'Pages' },
  { title: 'Hierarchy', href: '/hierarchy', category: 'Pages' },
];

export const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="relative w-full max-w-sm cursor-pointer"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-10 cursor-pointer"
          readOnly
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {searchItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  navigate(item.href);
                  setOpen(false);
                }}
              >
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
