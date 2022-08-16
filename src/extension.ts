import * as vscode from 'vscode';
import SirenBrowser from './SirenBrowser';

let app: SirenBrowser;

export function activate(context: vscode.ExtensionContext) {
	app = new SirenBrowser(context);

	// TODO 
	// - Documentation
	// - Save state so we don't have to reload everything every time we click
	// - Styles 
	// - Actual Tree
	//		- Delete nodes
	//		- Navigate to nodes (Re-request probably best)
	// - Content View
	//		- Inputs
	//		- Display: Siren Entity structure
	// - Deactivate functions?
}

export function deactivate() {
	app.deactivate();
}
