import * as vscode from 'vscode';
import { Event } from './events/Event';
import { EventType } from './events/EventTypes';
import { ContentWebView } from './webviews/ContentWebView';
import { TreeWebView } from './webviews/TreeWebView';

export function activate(context: vscode.ExtensionContext) {
	const treeProvider = new TreeWebView(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			TreeWebView.viewType,
			treeProvider
		)
	);

	const contentView = new ContentWebView();

	setTimeout(() => treeProvider.sendEvent(new Event(
		EventType.treeLinkAdded,
		'I am only a test'
	)), 2000);
	
	setTimeout(() => contentView.sendEvent(new Event(
		EventType.contentUpdated,
		'I am only a test'
	)), 2000);
}

export function deactivate() {
	// TODO
}
