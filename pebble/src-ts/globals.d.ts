declare module "commodetto/Poco" {
  const Poco: any;
  export default Poco;
}

declare module "piu/MC" {
  // Importing this module makes Piu globals available
}

declare module "piu/Timeline" {
  class Timeline {
    constructor();
    duration: number;
    to(target: any, properties: any, duration: number, easing?: any, delay?: number): Timeline;
    on(target: any, properties: any, duration: number, easing?: any, delay?: number): Timeline;
    seekTo(time: number): void;
  }
  export default Timeline;
}

// Piu globals (available after import {} from "piu/MC")
declare const Skin: any;
declare const Texture: any;
declare const Style: any;
declare const Behavior: any;
declare const Content: any;
declare const Container: any;
declare const Application: any;
declare const Scroller: any;
declare const Row: any;
declare const Column: any;
declare const Layout: any;
declare const Image: any;
declare const Die: any;
declare const Port: any;
declare const Label: any;
declare const Text: any;
declare const Link: any;
declare const Transition: any;
declare const application: any;

declare module "fetch" {
  const fetch: any;
  export { fetch };
  export default fetch;
}

declare module "pebble/message" {
  class Message {
    input: number;
    output: number;
    target?: unknown;
    constructor(options?: {
      keys?: Map<string, number> | Array<string>;
      input?: number;
      output?: number;
      target?: unknown;
      onReadable?: (this: Message) => void;
      onWritable?: (this: Message) => void;
      onSuspend?: (this: Message) => void;
    });
    close(): void;
    read(): Map<string | number, any>;
    write(map: Map<string | number, any>): void;
  }

  export default Message;
}

declare module "pebble/button" {
  class Button {
    constructor(options: {
      types: string[];
      onPush: (pressed: boolean, which: string) => void;
    });
    close(): void;
  }

  export default Button;
}

declare const screen: unknown;

declare const watch: {
  connected: {
    app: boolean;
    pebblekit: boolean;
  };
  addEventListener(type: string, listener: (event?: any) => void): void;
};

declare const Pebble: {
  addEventListener(type: string, listener: (event?: any) => void): void;
  sendAppMessage?(
    payload: Record<number, string | number | Array<number>>,
    success?: (event?: any) => void,
    failure?: (event?: any) => void
  ): void;
  openURL?(url: string): void;
};

declare function require(name: string): any;
declare function importNow(specifier: string): any;

declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
