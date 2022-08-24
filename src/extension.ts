import * as vscode from 'vscode';
import SirenBrowser from './SirenBrowser';

let app: SirenBrowser;

export function activate(context: vscode.ExtensionContext) {
	app = new SirenBrowser(context);

	// TODO 
	// - Documentation
	// - Tree View
	//		- Specific styles for highlighted node *** Priority
	// - Content View
	//		- Collapsable Sections
	//		- Ensure all possible information is represented
	// - Deactivate functions?
	// - Named content pages (Display in tree)
	// - Try extracting JS as much out of the template stuff as possible
	//		- import JS files saved elsewhere for example
	// - Refactoring

	// TODO - known bugs
	//	- Navigating to an existing base entity re-creates that base entity
	//	- Content view does not open when a link is clicked from the history
}

export function deactivate() {
	app.deactivate();
}
