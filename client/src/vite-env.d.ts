/// <reference types="vite/client" />

declare global {
  function gtag(
    command: string,
    eventName: string,
    params?: { [key: string]: any }
  ): void;
}
