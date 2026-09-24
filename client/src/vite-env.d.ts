/// <reference types="vite/client" />

declare module 'write-excel-file/browser' {
  export default function writeXlsxFile(
    data: any[],
    options?: {
      schema?: any[];
      fileName?: string;
      sheet?: string;
      columns?: any[];
    }
  ): Promise<void>;
}

