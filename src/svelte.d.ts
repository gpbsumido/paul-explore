// Type for `import Game from "./Game.svelte"`. The compiler checks the real
// props inside the component; this just tells tsc what the import gives back.
declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component<{
    random?: () => number;
    now?: () => number;
  }>;
  export default component;
}
