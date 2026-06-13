import { PageHeader } from '@/components/ui/PageHeader';
import { LearnMore } from '@/components/LearnMore';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import type { ModuleKey } from '@/services/moduleConfig';

interface Props {
  module: ModuleKey;
  /** Translated default title (used when admin hasn't overridden it). */
  defaultTitle: string;
  /** Translated default description. */
  defaultDescription: string;
  badge?: string;
}

/**
 * Page header whose title/description come from Module Configuration
 * (admin-editable), with a "Learn More" button for the module's help content.
 * Falls back to the translated defaults when nothing is configured.
 */
export function ConfigurablePageHeader({ module, defaultTitle, defaultDescription, badge }: Props) {
  const cfg = useModuleConfig(module);
  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title={cfg.headerTitle || defaultTitle}
        description={cfg.headerDescription || defaultDescription}
        badge={badge}
      />
      <LearnMore title={cfg.headerTitle || defaultTitle} content={cfg.learnMore} />
    </div>
  );
}
