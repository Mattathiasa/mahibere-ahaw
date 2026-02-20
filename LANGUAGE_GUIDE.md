# Language Switching Guide

## How It Works Now

### English Mode (Default)
When the application is in English mode:

```
┌─────────────────────────────────────┐
│  🌙  AM  [Login]                    │  ← Language toggle shows "AM"
├─────────────────────────────────────┤
│                                     │
│  Mahibere Ahaw Yekiristos          │
│  Betekerstian                       │
│                                     │
│  A renewed Orthodox Church...       │  ← All text in English
│                                     │
│  [Get Started]  [Learn More]       │
│                                     │
├─────────────────────────────────────┤
│  Congregations    Admin Staff       │
│      850            2.4k            │
│                                     │
│  Spiritual Growth  Global Reach     │
│      40%            120+            │
├─────────────────────────────────────┤
│  Platform          Support          │
│  • Dashboard       • Documentation  │
│  • Community       • Help Center    │
│  • Analytics       • Status         │
│  • Security                         │
│                                     │
│  © 2025 Mahibere Ahaw Ecosystem    │
│  Privacy Architecture | Terms...    │
└─────────────────────────────────────┘
```

### Amharic Mode
When you click "AM" button, everything switches to Amharic:

```
┌─────────────────────────────────────┐
│  🌙  EN  [ግባ]                       │  ← Language toggle shows "EN"
├─────────────────────────────────────┤
│                                     │
│  ማኅበረ አኀው የክርስቶስ ቤተክርስቲያን      │
│                                     │
│  በመጽሐፍ ቅዱስ የተገለጠውን...            │  ← All text in Amharic
│                                     │
│  [እንቀሳቀስ በመጀመሪያ?]  [ተጨማሪ ይመልከቱ] │
│                                     │
├─────────────────────────────────────┤
│  ጉባኤዎች          የአስተዳደር ሰራተኞች    │
│   850              2.4k            │
│                                     │
│  መንፈሳዊ እድገት      ዓለም አቀፍ ተደራሽነት  │
│   40%              120+            │
├─────────────────────────────────────┤
│  መድረክ             ድጋፍ              │
│  • ዳሽቦርድ          • ሰነዶች           │
│  • ማህበረሰብ         • የእገዛ ማዕከል      │
│  • ትንታኔዎች         • ሁኔታ           │
│  • ደህንነት                           │
│                                     │
│  © 2025 ማኅበረ አኀው ስነ-ምህዳር...       │
│  የግላዊነት አርክቴክቸር | የእምነት ውሎች...  │
└─────────────────────────────────────┘
```

## Key Features

### 1. Language Toggle Button
- **In English Mode**: Shows "AM" (click to switch to Amharic)
- **In Amharic Mode**: Shows "EN" (click to switch to English)

### 2. Complete Separation
- No mixing of languages
- All UI elements translate
- Consistent experience

### 3. What Translates

#### Navigation
- Home, About, Services, Contact
- Login button

#### Hero Section
- Title and subtitle
- Description text
- Call-to-action buttons

#### Statistics
- Labels for all metrics
- Congregations, Admin Staff, etc.

#### Features Section
- Feature titles and descriptions
- "Learn More" links
- Section headers

#### Footer
- Platform links
- Support links
- Email placeholder
- Copyright text
- Legal links

#### Floating Elements
- "Active Souls" counter
- "Service Uptime" indicator

## Translation Keys Reference

### Common UI Elements
```typescript
t('home')           // Home / ዋና ገፅ
t('login')          // Login / ግባ
t('languageToggle') // AM / EN
```

### Hero Section
```typescript
t('heroTitle')       // Main title
t('heroDescription') // Description
t('getStarted')      // Get Started button
t('learnMore')       // Learn More button
```

### Statistics
```typescript
t('congregations')    // Congregations / ጉባኤዎች
t('adminStaff')       // Admin Staff / የአስተዳደር ሰራተኞች
t('spiritualGrowth')  // Spiritual Growth / መንፈሳዊ እድገት
t('globalReach')      // Global Reach / ዓለም አቀፍ ተደራሽነት
```

### Features
```typescript
t('membersTitle')    // Member Management
t('membersDesc')     // Description
t('planningTitle')   // Planning Management
t('reportsTitle')    // Report Management
t('learnMoreLink')   // LEARN MORE / ተጨማሪ ይመልከቱ
```

### Footer
```typescript
t('platform')              // Platform / መድረክ
t('support')               // Support / ድጋፍ
t('stayConnected')         // Stay Connected
t('emailPlaceholder')      // Email Address
t('copyrightText')         // Copyright notice
t('privacyArchitecture')   // Privacy Architecture
t('termsOfFaith')          // Terms of Faith
```

## Adding New Translations

To add a new translatable text:

1. **Add to translations file** (`src/i18n/translations.ts`):
```typescript
export const translations = {
  en: {
    myNewKey: 'My English Text',
    // ... other keys
  },
  am: {
    myNewKey: 'የእኔ አማርኛ ጽሑፍ',
    // ... other keys
  },
};
```

2. **Use in component**:
```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return <div>{t('myNewKey')}</div>;
}
```

3. **Result**:
- English mode: "My English Text"
- Amharic mode: "የእኔ አማርኛ ጽሑፍ"

## Testing Checklist

### English Mode ✓
- [ ] Language toggle shows "AM"
- [ ] All navigation in English
- [ ] Hero section in English
- [ ] Statistics labels in English
- [ ] Feature cards in English
- [ ] Footer sections in English
- [ ] No Amharic characters visible

### Amharic Mode ✓
- [ ] Language toggle shows "EN"
- [ ] All navigation in Amharic
- [ ] Hero section in Amharic
- [ ] Statistics labels in Amharic
- [ ] Feature cards in Amharic
- [ ] Footer sections in Amharic
- [ ] No English words visible (except brand names)

## Notes

- Brand names (like "Mahibere Ahaw") can remain in their original form
- Numbers and statistics (850, 2.4k, etc.) remain the same
- Icons and visual elements don't change
- The language preference is stored in the LanguageContext
- Switching is instant - no page reload needed
