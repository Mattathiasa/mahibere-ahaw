import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { userService } from '@/services/users';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { usePermissions } from '@/contexts/PermissionContext';

interface User {
  id: string;
  fullName: string;
  fullNameAmharic?: string;
  hierarchyLevel: string;
}

interface RecipientSelectorProps {
  value: string[];
  onChange: (recipients: string[]) => void;
  label?: string;
  placeholder?: string;
  hierarchyLevel?: string; // Filter by hierarchy level (e.g., "Memriya")
  maxRecipients?: number;
}

export function RecipientSelector({
  value = [],
  onChange,
  label = 'Recipients',
  placeholder = 'Select recipients...',
  hierarchyLevel = 'Memriya', // Default to Memriya
  maxRecipients = 10,
}: RecipientSelectorProps) {
  const { t, language } = useTranslation();
  const { canReadWholeDirectory, myAtbiyaId } = usePermissions();
  const [open, setOpen] = useState(false);

  /**
   * Candidates this account may actually see.
   *
   * Two bugs met here. The list was read from `usersData?.users`, but
   * `getUsersByHierarchyLevel` returns a bare ARRAY — so `users` was always `[]`
   * and this picker has been permanently empty everywhere it is used (Finance's
   * three dialogs and Plans).
   *
   * Fixing the shape alone would not have been enough: that query filtered on
   * `hierarchyLevel` only, and the member directory rule now requires either wide
   * scope or an `atbiyaId` equality filter, so it would have gone from silently
   * empty to permission-denied. Reading the scoped directory and filtering by role
   * in memory satisfies both — the same trade `atbiyaAdminService.list` makes.
   */
  const { data: scoped, isLoading } = useQuery({
    queryKey: ['users', 'in-scope', canReadWholeDirectory, myAtbiyaId],
    queryFn: () =>
      userService.getUsersInScope({ wholeDirectory: canReadWholeDirectory, atbiyaId: myAtbiyaId }),
  });

  const users: User[] = ((scoped?.users ?? []) as User[]).filter(
    (u) => !hierarchyLevel || u.hierarchyLevel === hierarchyLevel
  );
  const selectedUsers = users.filter((user: User) => value.includes(user.id));

  const handleSelect = (userId: string) => {
    if (value.includes(userId)) {
      // Remove user
      onChange(value.filter(id => id !== userId));
    } else {
      // Add user (if not at max limit)
      if (value.length < maxRecipients) {
        onChange([...value, userId]);
      }
    }
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter(id => id !== userId));
  };

  const getUserDisplayName = (user: User) => {
    return language === 'am' && user.fullNameAmharic 
      ? user.fullNameAmharic 
      : user.fullName;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Selected Recipients */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map((user: User) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              {getUserDisplayName(user)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Recipient Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={value.length >= maxRecipients}
          >
            {value.length === 0 
              ? placeholder
              : `${value.length} recipient${value.length > 1 ? 's' : ''} selected`
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={`Search ${hierarchyLevel}s...`} />
            <CommandEmpty>
              {isLoading ? 'Loading...' : `No ${hierarchyLevel}s found.`}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {users.map((user: User) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => handleSelect(user.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.includes(user.id) ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div>
                      <div className="font-medium">{getUserDisplayName(user)}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.hierarchyLevel}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper Text */}
      <p className="text-sm text-muted-foreground">
        {value.length >= maxRecipients 
          ? `Maximum ${maxRecipients} recipients allowed`
          : `Select up to ${maxRecipients} recipients to send this document to`
        }
      </p>
    </div>
  );
}