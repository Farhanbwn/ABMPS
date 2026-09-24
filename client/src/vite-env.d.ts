/// <reference types="vite/client" />

declare module 'write-excel-file/browser' {
  export interface WriteXlsxFileResult {
    toBlob: () => Promise<Blob>;
    toFile: (fileName: string) => Promise<void>;
  }

  export default function writeXlsxFile(
    data: any[],
    sheetOptions?: {
      columns?: Array<{ width?: number }>;
      sheet?: string;
      [key: string]: any;
    },
    options?: any
  ): WriteXlsxFileResult;
}

