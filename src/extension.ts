import * as vscode from 'vscode';
import SirenBrowser from './SirenBrowser';

let app: SirenBrowser;

export function activate(context: vscode.ExtensionContext) {
	app = new SirenBrowser(context);

	// TODO 
	// - ReadMe
	// - Documentation
	// - Content View
	//		- Collapsable Sections
	//		- Ensure all possible information is represented
	// - Deactivate functions?
	// - Named content pages (Display in tree)
	// - Refactoring
	// 		- Try extracting JS as much out of the template stuff as possible
	//			- import JS files saved elsewhere for example
	// - Hotkeys
	// - Right click, search selected
}

export function deactivate() {
	app.deactivate();
}
