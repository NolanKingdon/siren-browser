import * as vscode from 'vscode';
import WebviewGenerator from "./WebviewGenerator";

export class TreeWebView implements WebviewGenerator, vscode.WebviewViewProvider {
	
	public static readonly viewType = 'sirenBrowser.requestTree';
    private readonly _extensionUri: vscode.Uri;
	private _view?: vscode.WebviewView;

	constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

	resolveWebviewView(
		webviewView: vscode.WebviewView, 
		context: vscode.WebviewViewResolveContext<unknown>, 
		token: vscode.CancellationToken
	): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = `
		 <!DOCTYPE html>
			<html>
				<body>
					<button>New Request</button>
					<h1>This will be something else</h1>
				</body>
			</html>
		`;

		this._view = webviewView;
	}

    sendEvent(event: any): void {
        throw new Error('Method not implemented.');
    }
}