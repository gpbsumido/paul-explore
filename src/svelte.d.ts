// Type for `import Game from "./Game.svelte"`. The compiler checks the real
// props inside the component; this just tells tsc what the import gives back.
declare module "*.svelte" {
  import type { Component } from "svelte";
  import type { Connect } from "@/app/mind-reader/_room/protocol";
  const component: Component<{
    random?: () => number;
    now?: () => number;
    connect?: Connect;
    joinCode?: string;
  }>;
  export default component;
}
