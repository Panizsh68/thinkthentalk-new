const RTL_PATTERN = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

export function getTextDirection(
  value: string | null | undefined,
): 'rtl' | 'ltr' {
  if (!value) {
    return 'ltr';
  }

  return RTL_PATTERN.test(value) ? 'rtl' : 'ltr';
}
