export interface NormalizedError {
  name?: string;
  message?: string;
}

// Normaliza diferentes formatos de erro (Error, DOMException, objetos literais)
// para evitar o uso de `any` nos componentes e padronizar mensagens de toast.
export const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as { name?: unknown; message?: unknown };
    return {
      name: typeof candidate.name === "string" ? candidate.name : undefined,
      message: typeof candidate.message === "string" ? candidate.message : undefined,
    };
  }

  return { message: typeof error === "string" ? error : undefined };
};
