import { TextField, Input, Label, Description } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  name?: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "number" | "date" | "time" | "datetime-local";
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  autoComplete?: string;
  className?: string;
}

/**
 * Labelled text input — the workhorse field for every form across both consoles.
 * Wraps HeroUI's `TextField` so label/input/description stay consistent.
 */
export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  description,
  defaultValue,
  value,
  onChange,
  isRequired,
  isDisabled,
  autoComplete,
  className,
}: FormFieldProps) {
  return (
    <TextField
      name={name}
      type={type}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      autoComplete={autoComplete}
      className={cn("flex flex-col gap-1.5", className)}
    >
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
      {description ? <Description>{description}</Description> : null}
    </TextField>
  );
}
