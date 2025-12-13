declare module 'react-hook-form' {
  export type FieldValues = Record<string, any>;

  export interface UseFormReturn<TFieldValues extends FieldValues = FieldValues> {
    control: any;
    watch: (
      cb: (values: Partial<TFieldValues>) => void,
    ) => { unsubscribe: () => void };
    trigger: () => Promise<boolean>;
    formState: {
      errors: Partial<Record<keyof TFieldValues, any>>;
    };
    handleSubmit: any;
    getValues: () => Partial<TFieldValues>;
    setValue: (name: keyof TFieldValues, value: any) => void;
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
}
