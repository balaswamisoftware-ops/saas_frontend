"use client";

import { useCallback, useState } from "react";
import type { ApiErrorShape } from "@/lib/api/types";

type Errors<T> = Partial<Record<keyof T, string>> & { _form?: string };

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Errors<T>;
}

/**
 * Lightweight controlled-form helper: value state, change handlers, submit
 * lifecycle and automatic mapping of backend validation errors (the API's
 * `{ errors: [{ field, message }] }`) onto field-level messages.
 */
export function useForm<T extends Record<string, unknown>>(opts: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(opts.initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setField(name as keyof T, (type === "number" ? Number(value) : value) as T[keyof T]);
    },
    [setField]
  );

  const reset = useCallback(() => {
    setValues(opts.initialValues);
    setErrors({});
  }, [opts.initialValues]);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (opts.validate) {
        const v = opts.validate(values);
        if (Object.keys(v).length) {
          setErrors(v);
          return;
        }
      }
      setSubmitting(true);
      setErrors({});
      try {
        await opts.onSubmit(values);
      } catch (err) {
        const api = err as ApiErrorShape;
        const fieldErrors: Errors<T> = {};
        api.errors?.forEach((fe) => {
          (fieldErrors as Record<string, string>)[fe.field] = fe.message;
        });
        if (!api.errors?.length) fieldErrors._form = api.message;
        setErrors(fieldErrors);
      } finally {
        setSubmitting(false);
      }
    },
    [opts, values]
  );

  return { values, errors, submitting, setField, handleChange, submit, reset, setValues };
}
