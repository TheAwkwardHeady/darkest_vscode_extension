# Building the extension

1. Install Node.js (which includes npm).
2. Open a terminal in this folder, where `package.json` is located.
3. Run `npm install` to install the project's development dependencies.
4. Run `npm run compile` to compile the TypeScript into `out/`.
5. In VS Code, press F5 to launch the Extension Development Host.

Do not run `tsc` directly from PowerShell unless TypeScript is installed globally.
The project uses its local TypeScript dependency through the npm scripts.
