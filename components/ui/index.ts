/**
 * Central UI barrel.
 *
 * Import every primitive from here (`@/components/ui`) instead of reaching into
 * `@heroui/react` directly. This keeps a single, consistent component surface
 * across the SaaS console and the tenant admin dashboard, and gives us one
 * place to swap or wrap a primitive later.
 */

export {
  // Actions & feedback
  Button,
  ButtonGroup,
  Alert,
  Spinner,
  Skeleton,
  Toast,
  toast,
  Tooltip,
  // Layout & content
  Card,
  Surface,
  Separator,
  Tabs,
  Accordion,
  EmptyState,
  Typography,
  Breadcrumbs,
  // Data display
  Avatar,
  Badge,
  Chip,
  Table,
  Pagination,
  // Overlays
  Modal,
  Drawer,
  Popover,
  Dropdown,
  Menu,
  // Forms
  Form,
  TextField,
  Input,
  TextArea,
  SearchField,
  NumberField,
  Select,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Switch,
  Label,
  Description,
  ListBox,
  ListBoxItem,
  // Navigation
  Link,
  // Hooks
  useOverlayState,
  useTheme,
  useMediaQuery,
} from "@heroui/react";

export { cn, tv } from "@/lib/utils";
export type { VariantProps } from "@/lib/utils";

// Project composite components built on top of the primitives above.
export * from "./page-header";
export * from "./refresh-button";
export * from "./stat-card";
export * from "./data-table";
export * from "./status-chip";
export * from "./search-input";
export * from "./confirm-dialog";
export * from "./form-dialog";
export * from "./form-page";
export * from "./phone-field";
export * from "./section-card";
export * from "./form-field";
export * from "./select-field";
export * from "./check-option";
export * from "./switch-option";
