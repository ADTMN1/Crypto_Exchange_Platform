/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: any) => any;
    };
  }
}

export {};
