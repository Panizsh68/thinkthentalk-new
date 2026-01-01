declare module 'react-hook-form' {
  export type FieldValues = Record<string, any>;

  export interface UseFormReturn<TFieldValues extends FieldValues = FieldValues> {
    control: any;
    watch: any;
    trigger: () => Promise<boolean>;
    formState: {
      errors: Partial<Record<keyof TFieldValues, any>>;
    };
    handleSubmit: any;
    getValues: any;
    setValue: (name: keyof TFieldValues, value: any) => void;
    reset: (values?: Partial<TFieldValues>) => void;
  }

  export interface ControllerRenderProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends keyof TFieldValues = keyof TFieldValues,
  > {
    name: TName;
    value: TFieldValues[TName];
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    ref: any;
  }

  export function useForm<TFieldValues extends FieldValues = FieldValues>(
    options?: any,
  ): UseFormReturn<TFieldValues>;

  export function useFieldArray(options?: any): any;
}
