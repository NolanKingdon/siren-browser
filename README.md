# Siren Browser VSCode
Easy browsing of siren hypermedia reponses directly from your VSCode instance.

## Install
### Locally
To install the extension locally you will need to compile the `vsix` file from source:
#### Part 1 - Generate the `vsix`
 - Clone repo to your computer
 - run `npm install`
 - run `npm run vsce:package` 
 - Respond `y` to prompts
 
 *Successful runs will show this message upon completion:*
 ![Successful Compile Terminal Result](https://github.com/NolanKingdon/siren-browser/blob/main/imgs/successfulCompile.png)
#### Part 2 - Load into VSCode
 - Click on the **Extensions** icon in the activity bar 
 - Click on the triple dots in the top right of the **Extensions** window
 - Select `Install from vsix`
 - Locate the `.vsix` (Should be `*/vscode-siren/vscode-siren-[ver].vsix`)

![Manual Install Location](https://github.com/NolanKingdon/siren-browser/blob/main/imgs/manualInstall.png)
### Extension Marketplace
*Currently the extension is not in the extension marketplace*

### Development
To run the extension locally for development, clone the repo and run `npm install` and open the repo within VSCode. Pressing `F5` will launch a new instance of VSCode with the extension loaded in.

`.vscode/launch.json` is configured with the `DEVELOPMENT` variable. Any debugging related functionality should be gated behind a `process.env.DEVELOPMENT` check.

### Contributing
PRs welcome! If you bump into an issue when using the extension or have an idea you think would improve the extension, feel free to open a new Issue/PR.
