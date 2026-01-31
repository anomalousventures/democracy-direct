# Styling & Shadcn Audit

Tracking document for ensuring consistent use of Shadcn components and styling patterns.

## Available Shadcn Components

- `Button` - `@/components/ui/button` (variants: default, destructive, outline, secondary, ghost, link, civic, civicSecondary, contactPrimary, contactSecondary, contactOutline, success)
- `Dialog` - `@/components/ui/dialog`
- `Input` - `@/components/ui/input` (variants: default, civic)
- `Label` - `@/components/ui/label`
- `LoadingButton` - `@/components/ui/loading-button`
- `Skeleton` - `@/components/ui/skeleton`
- `Toaster` (Sonner) - `@/components/ui/sonner` + `toast` from "sonner"
- `Card` - `@/components/ui/card` (variants: default, civic, civicLg)
- `Badge` - `@/components/ui/badge` (variants: default, secondary, destructive, outline, success, warning)
- `Alert` - `@/components/ui/alert`

## Astro Component Wrappers

For server-rendered pages, we provide Astro wrappers that use the shared variants:

- `AstroButton` - `@/components/ui/AstroButton.astro`
- `AstroCard` - `@/components/ui/AstroCard.astro`
- `AstroBadge` - `@/components/ui/AstroBadge.astro`
- `AstroAlert` - `@/components/ui/AstroAlert.astro`
- `AstroInput` - `@/components/ui/AstroInput.astro`

## Shared Variants (`@/components/ui/variants.ts`)

All variant definitions are centralized in `variants.ts` and shared between React and Astro components:

- `buttonVariants` - Button styling variants
- `cardVariants` - Card styling variants
- `badgeVariants` - Badge styling variants
- `inputVariants` - Input styling variants

## React Components

| File                       | Status  | Shadcn Used                          | Notes                                                   |
| -------------------------- | ------- | ------------------------------------ | ------------------------------------------------------- |
| `AuthButton.tsx`           | ✅ Done | Button                               | Already using Shadcn                                    |
| `ShareButtons.tsx`         | ✅ Done | Button                               | Updated to use Shadcn Button                            |
| `LoginDialog.tsx`          | ✅ Done | Dialog, Input, Button, LoadingButton | Uses Sonner toast                                       |
| `TemplateEditClient.tsx`   | ✅ Done | -                                    | Uses Sonner toast                                       |
| `TemplateCreateClient.tsx` | ✅ Done | -                                    | Uses Sonner toast                                       |
| `LoginRequiredToast.tsx`   | ✅ Done | -                                    | Uses Sonner toast                                       |
| `ContactActions.tsx`       | ✅ Done | Button                               | Updated to use Shadcn Button, react-icons, Sonner toast |
| `ContactFlow.tsx`          | ✅ Done | Button, Checkbox, Label              | Updated buttons, checkboxes, icons                      |
| `PrintLetter.tsx`          | ✅ Done | Button                               | Updated to use Shadcn Button, react-icons               |
| `TemplateForkClient.tsx`   | ✅ Skip | -                                    | Uses TemplateForm which has Shadcn components           |
| `AddressForm.tsx`          | ✅ Done | Input, Label, Checkbox, Button       | Updated to use Shadcn components                        |
| `UserInfoInputs.tsx`       | ✅ Done | Input, Label, Checkbox               | Updated to use Shadcn components                        |
| `TemplateForm.tsx`         | ✅ Done | Input, Label, LoadingButton          | Updated to use Shadcn components                        |
| `TemplateSearch.tsx`       | ✅ Done | Input                                | Uses Input with civic variant                           |
| `TiptapEditor.tsx`         | ✅ Skip | -                                    | Rich text editor, requires custom styling               |
| `ZipLookup.tsx`            | ✅ Skip | -                                    | Hero component with intentional custom gradient styling |
| `LetterPreview.tsx`        | ✅ Skip | -                                    | Print preview component, minimal interactive elements   |
| `LetterComposer.tsx`       | ✅ Skip | -                                    | Wrapper component, uses TiptapEditor                    |

## Astro Components

| File            | Status  | Notes                                |
| --------------- | ------- | ------------------------------------ |
| `Header.astro`  | ✅ Done | Navigation component (no components) |
| `Footer.astro`  | ✅ Done | Footer component (no components)     |
| `Layout.astro`  | ✅ Done | Base layout                          |
| `posthog.astro` | ✅ Done | Analytics script                     |

## Astro Pages

| File                          | Status  | Components Used                    | Notes            |
| ----------------------------- | ------- | ---------------------------------- | ---------------- |
| `index.astro`                 | ✅ Done | AstroCard (civic)                  | Homepage         |
| `about.astro`                 | ✅ Done | AstroCard (civicLg)                | About page       |
| `privacy.astro`               | ✅ Done | AstroCard (civicLg)                | Privacy policy   |
| `roadmap.astro`               | ✅ Done | -                                  | Roadmap page     |
| `404.astro`                   | ✅ Done | AstroButton                        | Error page       |
| `500.astro`                   | ✅ Done | AstroButton                        | Error page       |
| `rep/[bioguideId].astro`      | ✅ Done | AstroButton, AstroCard             | Rep profile      |
| `zip/[zip].astro`             | ✅ Done | AstroButton, AstroCard             | ZIP results      |
| `templates/index.astro`       | ✅ Done | AstroButton, AstroAlert            | Templates list   |
| `templates/[slug].astro`      | ✅ Done | AstroButton, AstroCard             | Template detail  |
| `templates/new.astro`         | ✅ Done | AstroCard                          | Create template  |
| `templates/mine.astro`        | ✅ Done | AstroButton, AstroBadge, AstroCard | My templates     |
| `templates/[slug]/edit.astro` | ✅ Done | AstroButton, AstroCard             | Edit template    |
| `templates/fork/[slug].astro` | ✅ Done | AstroButton, AstroCard             | Fork template    |
| `admin/index.astro`           | ✅ Done | AstroCard                          | Admin dashboard  |
| `admin/queue.astro`           | ✅ Done | AstroButton, AstroBadge, AstroCard | Moderation queue |
| `admin/tags.astro`            | ✅ Done | AstroButton, AstroBadge, AstroCard | Tag management   |
| `admin/users.astro`           | ✅ Done | AstroButton, AstroBadge            | User management  |

## Custom CSS Classes Retained (global.css)

These semantic layout/utility classes provide the "Civic Modernist" design system aesthetic:

### Layout Utilities

- `.container-page`, `.container-narrow`, `.container-medium`, `.container-wide`, `.container-xl`
- `.section-default`, `.section-hero`, `.section-page`, `.section-content`, `.section-cta`
- `.flex-between`, `.flex-center`, `.flex-start`
- `.grid-features`

### Typography

- `.heading-page`, `.heading-section`, `.heading-card`, `.heading-card-lg`
- `.text-caption`, `.text-body`
- `.text-gradient` - Hero text gradient effect

### Visual Elements

- `.divider-civic` - Decorative divider with star
- `.icon-box`, `.icon-box-sm`, `.icon-box-lg`, `.icon-box-accent`
- `.hero-badge`, `.accent-dot`
- `.backdrop-container`, `.backdrop-blob-primary`, `.backdrop-blob-accent`
- `.cta-grid-pattern`

### Content Patterns

- `.info-item`, `.feature-item`
- `.list-item-bullet`, `.list-bullet`, `.list-bullet-destructive`
- `.link-back`, `.link-accent`

### Roadmap-Specific

- `.roadmap-item`
- `.roadmap-badge-completed`, `.roadmap-badge-upnext`, `.roadmap-badge-planned`
- `.roadmap-circle-completed`, `.roadmap-circle-upnext`, `.roadmap-circle-planned`

### Rep-Specific

- `.party-badge`, `.party-badge-lg`
- `.rep-photo-sm`, `.rep-photo-lg`
- `.rep-photo-fallback-sm`, `.rep-photo-fallback-lg`

### Forms

- `.form-group`
- `.alert-error`

## CSS Classes Removed (migrated to variants)

The following classes were removed from `global.css` as they are now handled by component variants:

- `.card-civic` → `<AstroCard variant="civic">` or `<Card variant="civic">`
- `.card-civic-lg` → `<AstroCard variant="civicLg">` or `<Card variant="civicLg">`
- `.btn-contact-primary` → `<AstroButton variant="contactPrimary">`
- `.btn-contact-secondary` → `<AstroButton variant="contactSecondary">`
- `.btn-contact-outline` → `<AstroButton variant="contactOutline">`

---

## Architecture Summary

### Component Variant System

All styling variants are defined in `src/components/ui/variants.ts` using `class-variance-authority`:

```typescript
// variants.ts
export const buttonVariants = cva(/* base */, { variants: { ... } });
export const cardVariants = cva(/* base */, { variants: { ... } });
export const badgeVariants = cva(/* base */, { variants: { ... } });
export const inputVariants = cva(/* base */, { variants: { ... } });
```

### React Components

Import variants from `variants.ts` and use with `cn()` utility:

```typescript
import { buttonVariants } from "./variants";
<button className={cn(buttonVariants({ variant, size }), className)}>
```

### Astro Components

Import variants and use the same pattern:

```astro
---
import { cardVariants } from "./variants";
---

<div class={cn(cardVariants({ variant }), className)}>
  <slot />
</div>
```

This architecture ensures:

1. Single source of truth for styling variants
2. Consistent styling between React and Astro components
3. Type safety for variant props
4. Easy maintenance and updates
