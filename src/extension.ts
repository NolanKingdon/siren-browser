import * as vscode from 'vscode';
import { ContentWebView } from './webviews/ContentWebView';
import { TreeWebView } from './webviews/TreeWebView';

export function activate(context: vscode.ExtensionContext) {
	const treeProvider = new TreeWebView(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(TreeWebView.viewType, treeProvider));

	const contentView = new ContentWebView();
}

export function deactivate() {
	// TODO
}
