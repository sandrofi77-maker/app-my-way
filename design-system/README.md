# myway Design System

Universal design system for the myway app. Works on **iOS, Android, and Web** from a single codebase by using React Native + react-native-web primitives.

## Architecture

```
design-system/
├── tokens/          # Colors, spacing, typography, radius, shadows, z-index, motion
├── theme/           # Theme definition + ThemeProvider with light/dark support
├── hooks/           # useBreakpoint
├── components/      # All components (atomic design)
│   ├── primitives/  # Box, Text, Stack, Pressable
│   ├── travel/      # Domain-specific: FlightCard, AccommodationCard, etc.
│   └── *.tsx        # Core + feedback + overlays + navigation
└── storybook/       # In-app story viewer + story definitions
    └── stories/     # One file per section
```

## Usage

Wrap your app (or a subtree) with `ThemeProvider`:

```tsx
import { ThemeProvider } from '../design-system/theme'

export default function RootLayout() {
  return (
    <ThemeProvider defaultMode="light">
      {/* ...your routes */}
    </ThemeProvider>
  )
}
```

Import components:

```tsx
import { Button, Card, Text, VStack, useTheme } from '../design-system'

function Screen() {
  return (
    <Card>
      <VStack gap={3}>
        <Text variant="h3">Hello</Text>
        <Button>Go</Button>
      </VStack>
    </Card>
  )
}
```

## Storybook

The design system ships with an in-app Storybook that runs on mobile and web — no separate tooling required.

Navigate to the `/design-system` route while the app is running:

- **Web**: `http://localhost:8081/design-system`
- **Mobile**: open via deep link or temporarily add a navigation button

You can toggle light/dark mode and search stories from the sidebar.

## Foundations

| Token     | Purpose                                               |
| --------- | ----------------------------------------------------- |
| Colors    | Semantic aliases + raw palette (50-900 scales)        |
| Spacing   | 4px grid (`0`, `0.5`, `1`, `1.5`, `2`, ...)           |
| Typography| `display` → `label` variants                          |
| Radius    | `none` → `full`                                       |
| Shadows   | Cross-platform (iOS/Android/Web) 5-level elevation    |
| Z-index   | Layered stack for overlays                            |

## Components

### Primitives
Box, HStack, VStack, Text, Pressable, Spacer

### Core
Button, IconButton, FAB, Card, Badge, Tag, Avatar, Divider

### Forms
Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, SearchBar

### Feedback
Alert, Skeleton, Progress, EmptyState, Toast (via `ToastProvider` + `useToast`)

### Overlays
Modal, BottomSheet, Drawer, Tooltip

### Navigation
Tabs, Breadcrumb, Pagination

### Travel-specific
FlightCard, AccommodationCard, ExpenseCard, TripTimeline, Checklist, DayPlanner

## Theming

All components consume semantic tokens (`theme.colors.brand`, `theme.colors.surface`, etc.) so swapping light/dark mode is a no-op for consumers. Use `useTheme()` to access the active theme, or `useThemeMode()` to read/toggle the current mode.

## Accessibility

All interactive components set `accessibilityRole` and `accessibilityLabel`. Form components propagate labels to their inputs. Focused inputs show the theme focus ring.
