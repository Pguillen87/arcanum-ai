import { useCallback, useMemo } from "react";
import { AUDIO_EXTENSIONS, AUDIO_MIME_TYPES } from "@/constants/mediaFormats";

export const MAX_AUDIO_SIZE_MB = 200;

const HTML_ESCAPE_REGEX = /[&<>"]|'/g;
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

type ValidationErrorCode = "no_file" | "invalid_type" | "invalid_size" | "suspicious_name";

export interface AudioValidationMetadata {
  sanitizedName: string;
  originalName: string;
  extension: string | null;
  mimeType: string;
  sizeBytes: number;
  sizeMB: number;
}

export interface AudioValidationResult {
  isValid: boolean;
  error?: {
    code: ValidationErrorCode;
    message: string;
  };
  metadata?: AudioValidationMetadata;
}

const SUSPICIOUS_EXTENSIONS = [".exe", ".bat", ".cmd", ".com", ".js", ".msi"];

function sanitizeFileName(name: string): string {
  return name.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char]).trim();
}

function getExtension(name: string): string | null {
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1 || lastDot === name.length - 1) {
    return null;
  }
  return name.slice(lastDot).toLowerCase();
}

function hasSuspiciousDoubleExtension(name: string): boolean {
  const lowerName = name.toLowerCase();
  const segments = lowerName.split(".");

  if (segments.length < 3) {
    return false;
  }

  const lastExt = `.${segments.pop()!}`;
  const previousExt = `.${segments.pop()!}`;

  return (
    SUSPICIOUS_EXTENSIONS.includes(lastExt) &&
    AUDIO_EXTENSIONS.includes(previousExt as (typeof AUDIO_EXTENSIONS)[number])
  );
}

export function useAudioValidation(options?: { maxSizeMB?: number }) {
  const maxSizeMB = options?.maxSizeMB ?? MAX_AUDIO_SIZE_MB;
  const maxSizeBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  const validateAudio = useCallback(
    (file: File | null): AudioValidationResult => {
      if (!file) {
        return {
          isValid: false,
          error: {
            code: "no_file",
            message: "Nenhum arquivo selecionado",
          },
        };
      }

      const sanitizedName = sanitizeFileName(file.name);
      const extension = getExtension(sanitizedName);
      const mimeType = file.type?.toLowerCase() ?? "";
      const sizeBytes = file.size;
      const sizeMB = sizeBytes / (1024 * 1024);

      if (hasSuspiciousDoubleExtension(sanitizedName)) {
        return {
          isValid: false,
          error: {
            code: "suspicious_name",
            message: "O nome do arquivo parece suspeito. Verifique a extensão antes de continuar.",
          },
        };
      }

      const isMimeAccepted = mimeType
        ? AUDIO_MIME_TYPES.includes(mimeType as (typeof AUDIO_MIME_TYPES)[number])
        : false;
      const isExtensionAccepted = extension
        ? AUDIO_EXTENSIONS.includes(extension as (typeof AUDIO_EXTENSIONS)[number])
        : false;

      if (!isMimeAccepted && !isExtensionAccepted) {
        return {
          isValid: false,
          error: {
            code: "invalid_type",
            message: "Formato de arquivo não suportado",
          },
        };
      }

      if (sizeBytes > maxSizeBytes) {
        return {
          isValid: false,
          error: {
            code: "invalid_size",
            message: `O arquivo excede o limite de ${maxSizeMB}MB`,
          },
        };
      }

      return {
        isValid: true,
        metadata: {
          sanitizedName,
          originalName: file.name,
          extension,
          mimeType,
          sizeBytes,
          sizeMB,
        },
      };
    },
    [maxSizeBytes, maxSizeMB],
  );

  return {
    validateAudio,
    maxSizeMB,
    acceptedTypes: AUDIO_MIME_TYPES,
    acceptedExtensions: AUDIO_EXTENSIONS,
  };
}

