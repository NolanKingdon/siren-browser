import * as vscode from 'vscode';
import SirenBrowser from './SirenBrowser';

let app: SirenBrowser;

export function activate(context: vscode.ExtensionContext) {
	app = new SirenBrowser(context);

	// TODO 
	// - Documentation
	// - Save state so we don't have to reload everything every time we click
	// - Styles 
	//		- CSS
	//		- Better Icon
	// - Actual Tree
	//		- Delete nodes
	//		- Short URL display
	// - Content View
	//		- Inputs need to work
	//		- Ensure all possible information is represented
	// - Deactivate functions?
	// - Error Handling (Bad requests, events, etc.)
	//		- If we 401, we need to be shown that upfront and loudly
	// - Named content pages (Display in tree)

	// TODO - known bugs
	//	- Navigating to an existing base entity re-creates that base entity
	//	- using .map() causes commas to be placed in between all content
	//	- Content is not saved when navigating off of the tabs
}

export function deactivate() {
	app.deactivate();
}
