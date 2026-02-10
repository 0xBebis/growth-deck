# GrowthDeck Design System

A comprehensive guide to the GrowthDeck UI/UX system, optimized for accessibility, readability, and premium aesthetics.

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Accessibility](#accessibility)
6. [Animation](#animation)
7. [Usage Guidelines](#usage-guidelines)

---

## Color System

### Design Principles

- **WCAG 2.2 AA Compliance**: All text colors meet minimum contrast requirements
- **Color-Blind Safe**: Status colors work with patterns/icons, not color alone
- **Surface Hierarchy**: Layered elevations create depth without confusion

### Core Palette

```css
/* Backgrounds - Surface Hierarchy */
--color-surface-0: #09090b;  /* Page background */
--color-surface-1: #131316;  /* Card level */
--color-surface-2: #1a1a1f;  /* Elevated (dropdowns) */
--color-surface-3: #232329;  /* Modal (highest) */

/* Text Hierarchy - WCAG Compliant */
--color-text-primary: #fafafa;    /* 17.4:1 - AAA */
--color-text-secondary: #d4d4d8;  /* 9.7:1 - AAA */
--color-text-tertiary: #a1a1aa;   /* 4.57:1 - AA */
--color-text-muted: #71717a;      /* 3.1:1 - UI only */
```

### Semantic Colors

| Token | Value | Usage | Contrast |
|-------|-------|-------|----------|
| `--color-success` | `#22c55e` | Positive states | 4.5:1+ |
| `--color-warning` | `#f59e0b` | Caution states | 4.5:1+ |
| `--color-destructive` | `#ef4444` | Errors/danger | 4.5:1+ |
| `--color-info` | `#3b82f6` | Informational | 4.5:1+ |
| `--color-primary` | `#8b5cf6` | Brand/actions | 4.5:1+ |

### Chart Colors (Color-Blind Safe)

```css
--color-chart-1: #8b5cf6;  /* Purple */
--color-chart-2: #06b6d4;  /* Cyan */
--color-chart-3: #f59e0b;  /* Amber */
--color-chart-4: #ec4899;  /* Pink */
--color-chart-5: #10b981;  /* Emerald */
```

### Usage Examples

```tsx
// Text hierarchy
<h1 className="text-primary">Main Title</h1>
<p className="text-secondary">Body content</p>
<span className="text-tertiary">Supporting text</span>
<small className="text-muted">Metadata</small>

// Status indicators (always pair with icon/pattern)
<span className="status-dot status-dot-success" />
<Badge variant="success">Sent</Badge>
```

---

## Typography

### Font Stack

- **Sans-serif**: Inter, with system fallbacks
- **Monospace**: JetBrains Mono, Fira Code

### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-xs` | 12px | 1.5 | Badges, labels |
| `--text-sm` | 14px | 1.5 | Secondary text |
| `--text-base` | 16px | 1.6 | Body text (minimum) |
| `--text-lg` | 18px | 1.55 | Lead paragraphs |
| `--text-xl` | 20px | 1.5 | Section headers |
| `--text-2xl` | 24px | 1.4 | Page sections |
| `--text-3xl` | 30px | 1.3 | Page titles |
| `--text-4xl` | 36px | 1.2 | Hero text |

### Utility Classes

```tsx
// Reading-optimized prose
<div className="prose">
  <p>Long-form content with optimal line length...</p>
</div>

// Dashboard metrics
<span className="metric-lg">1,234</span>

// Labels
<span className="label">Category</span>

// Large metrics
<span className="metric-xl">$12.5K</span>
```

### Best Practices

1. **Minimum font size**: 16px for body text
2. **Line length**: Max 65 characters for readability
3. **Line height**: 1.5-1.65 for body text
4. **Tabular numbers**: Use `font-variant-numeric: tabular-nums` for metrics

---

## Spacing & Layout

### 8-Point Grid

All spacing uses multiples of 8px:

```css
--space-1: 4px;    /* Tight */
--space-2: 8px;    /* Default */
--space-3: 12px;   /* Comfortable */
--space-4: 16px;   /* Sections */
--space-6: 24px;   /* Cards */
--space-8: 32px;   /* Large gaps */
--space-12: 48px;  /* Page sections */
--space-16: 64px;  /* Major divisions */
```

### Border Radius

```css
--radius-sm: 6px;   /* Inputs, badges */
--radius-md: 8px;   /* Buttons, small cards */
--radius-lg: 12px;  /* Cards */
--radius-xl: 16px;  /* Large cards, modals */
--radius-2xl: 20px; /* Hero elements */
```

---

## Components

### Skeleton Loaders

```tsx
import { Skeleton, SkeletonCard, SkeletonFeed } from "@/components/ui";

// Basic skeleton
<Skeleton className="h-4 w-32" />

// Card with content preview
<SkeletonCard showAvatar />

// Full feed placeholder
<SkeletonFeed count={5} />
```

### Empty States

```tsx
import { EmptyState, EmptyStatePresets } from "@/components/ui";

// Custom empty state
<EmptyState
  icon={<SearchIcon className="w-12 h-12" />}
  title="No posts found"
  description="Try adjusting your filters."
  action={<Button>Clear filters</Button>}
/>

// Preset empty states
<EmptyState {...EmptyStatePresets.noResults} />
<EmptyState {...EmptyStatePresets.emptyQueue} />
```

### Glass Surfaces

```tsx
// Primary card surface
<div className="glass rounded-xl p-6">...</div>

// Elevated (modals, dropdowns)
<div className="glass-strong rounded-xl p-4">...</div>

// Subtle (sidebar, navigation)
<div className="glass-subtle">...</div>

// Interactive card
<div className="glass-interactive rounded-xl p-4">...</div>
```

### Status Indicators

```tsx
// Status dots (always pair with text/icon)
<span className="status-dot status-dot-success" />
<span className="status-dot status-dot-warning" />
<span className="status-dot status-dot-danger" />

// Animated pulse for live status
<span className="status-dot status-dot-success status-dot-pulse" />
```

### Trend Indicators

```tsx
<span className="trend trend-up">
  <ArrowUpIcon className="w-4 h-4" />
  +12%
</span>

<span className="trend trend-down">
  <ArrowDownIcon className="w-4 h-4" />
  -5%
</span>
```

### Tooltip

```tsx
import { Tooltip, TooltipIconButton } from "@/components/ui";

// Basic tooltip
<Tooltip content="Edit this item" position="top">
  <button>Edit</button>
</Tooltip>

// Icon button with tooltip
<TooltipIconButton tooltip="Delete item" onClick={handleDelete}>
  <TrashIcon className="w-4 h-4" />
</TooltipIconButton>
```

### Breadcrumbs

```tsx
import { Breadcrumbs, PageHeader } from "@/components/ui";

// Basic breadcrumbs
<Breadcrumbs
  items={[
    { label: "Settings", href: "/settings" },
    { label: "Team" }
  ]}
/>

// Page header with breadcrumbs
<PageHeader
  title="Team Settings"
  description="Manage your team members and roles."
  breadcrumbs={[{ label: "Settings", href: "/settings" }]}
  actions={<Button>Invite Member</Button>}
/>
```

### Form Fields

```tsx
import { InputField, TextareaField, FieldGroup, FormSection } from "@/components/ui";

// Input with validation
<InputField
  label="Email"
  type="email"
  required
  error={errors.email}
  helperText="We'll never share your email."
/>

// Textarea with success state
<TextareaField
  label="Bio"
  rows={4}
  success="Saved successfully!"
/>

// Grouped fields
<FieldGroup>
  <InputField label="First Name" />
  <InputField label="Last Name" />
</FieldGroup>

// Form section
<FormSection
  title="Personal Information"
  description="Update your personal details."
>
  <InputField label="Name" />
  <InputField label="Email" type="email" />
</FormSection>
```

---

## Accessibility

### Focus States

All interactive elements have visible focus indicators:

```css
:focus-visible {
  box-shadow:
    0 0 0 2px var(--color-background),
    0 0 0 4px var(--color-primary);
}
```

### Touch Targets

Minimum 44x44px for all interactive elements:

```css
button:not(.touch-compact) {
  min-height: 44px;
}
```

### Screen Reader Support

```tsx
// Hidden text for screen readers
<span className="sr-only">Loading complete</span>

// Skip link (in layout)
<a href="#main-content" className="skip-link sr-only-focusable">
  Skip to content
</a>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode

```css
@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid CanvasText !important;
  }
}
```

### ARIA Guidelines

| Component | Required ARIA |
|-----------|---------------|
| Loading state | `role="status"`, `aria-live="polite"` |
| Error messages | `role="alert"` |
| Navigation | `aria-current="page"` |
| Expandable | `aria-expanded` |
| Tabs | `role="tablist"`, `aria-selected` |

---

## Animation

### Timing Guidelines

- **UI Feedback**: 150-200ms (button press, hover)
- **Transitions**: 200-300ms (page changes, reveals)
- **Complex**: 300-500ms (modals, large transforms)

### Available Animations

```tsx
// Fade in
<div className="animate-fade-in">...</div>

// Slide up with fade
<div className="animate-fade-up">...</div>

// Scale in
<div className="animate-scale-in">...</div>

// Shimmer (for loading)
<div className="animate-shimmer">...</div>

// Soft pulse (for attention)
<div className="animate-pulse-soft">...</div>
```

### Staggered Animations

```tsx
{items.map((item, i) => (
  <div
    key={item.id}
    className="animate-fade-up"
    style={{ animationDelay: `${i * 50}ms` }}
  >
    {item.name}
  </div>
))}
```

---

## Usage Guidelines

### Do's

- Use semantic color tokens, not raw hex values
- Always pair status colors with icons or patterns
- Maintain consistent spacing with the 8px grid
- Test with keyboard navigation
- Provide loading states for async content
- Use proper heading hierarchy (h1 > h2 > h3)

### Don'ts

- Don't use text smaller than 16px for body content
- Don't rely solely on color to convey meaning
- Don't disable focus outlines
- Don't use animations that flash or strobe
- Don't create touch targets smaller than 44px
- Don't use low-contrast text for important information

### Component Checklist

When creating new components:

- [ ] Uses semantic color tokens
- [ ] Has visible focus states
- [ ] Touch target >= 44px
- [ ] Supports reduced motion
- [ ] Has proper ARIA attributes
- [ ] Includes loading/empty states
- [ ] Follows 8px spacing grid
- [ ] Works with keyboard navigation

---

## File Reference

| File | Purpose |
|------|---------|
| `app/globals.css` | Design tokens, base styles, utilities |
| `components/ui/skeleton.tsx` | Skeleton loading components |
| `components/ui/empty-state.tsx` | Empty state component |
| `components/ui/tooltip.tsx` | Accessible tooltip component |
| `components/ui/breadcrumbs.tsx` | Breadcrumbs and page header |
| `components/ui/form-field.tsx` | Form input components with validation |
| `lib/utils/cn.ts` | Class name utility |
| `lib/utils/platform.ts` | Platform styling utilities |

---

*Last updated: 2026-02-09*
*Version: 2.0 - Accessibility Enhanced*
