// Ambient declaration for side-effect stylesheet imports (e.g. the global
// `import "./globals.css"` in the root layout). Without it the editor's TS
// server flags ts(2882) "Cannot find module or type declarations for
// side-effect import" even though the Next build resolves it fine. The more
// specific `*.module.css` typings from Next still win for CSS Modules.
declare module "*.css";
