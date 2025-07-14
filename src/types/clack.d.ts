declare module '@clack/prompts' {
  export const intro: (message: string) => void;
  export const outro: (message: string) => void;
  export const log: {
    error: (message: string) => void;
    info: (message: string) => void;
    success: (message: string) => void;
  };
} 