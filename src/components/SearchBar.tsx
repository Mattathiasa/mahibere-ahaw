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
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n/translations';

/**
 * The pages this searches, by their `nav` key. The titles used to be spelled
 * out here in English — a third copy of the navigation labels, after the
 * sidebar's and Software Control's — so searching in Amharic found nothing.
 */
const SEARCH_TARGETS: { navKey: keyof Translations['nav']; href: string }[] = [
  { navKey: 'dashboard', href: '/' },
  { navKey: 'announcements', href: '/announcements' },
  { navKey: 'plans', href: '/plans' },
  { navKey: 'reports', href: '/reports' },
  { navKey: 'members', href: '/members' },
  { navKey: 'meetings', href: '/meetings' },
  { navKey: 'higeDenb', href: '/hige-denb' },
  { navKey: 'settings', href: '/settings' },
  { navKey: 'hierarchy', href: '/hierarchy' },
];

export const SearchBar = () => {
  const { t } = useLanguage();
  const searchItems = SEARCH_TARGETS.map((x) => ({ title: t.nav[x.navKey], href: x.href }));
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
          placeholder={t.common.search}
          className="pl-10 cursor-pointer"
          readOnly
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t.forms.searchTypeToSearch} />
        <CommandList>
          <CommandEmpty>{t.forms.searchNoResults}</CommandEmpty>
          <CommandGroup heading={t.forms.searchPagesHeading}>
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
