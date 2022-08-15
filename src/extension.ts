import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const treeProvider = new SirenTreeProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(SirenTreeProvider.viewType, treeProvider));

	const test = vscode.window.createWebviewPanel('test', 'test', vscode.ViewColumn.One, {
		enableScripts: true
	});

	test.webview.html = '<html><body><h1>Working</h1></body></html>';
}

export function deactivate() {
	// TODO
}

class SirenTreeProvider implements vscode.WebviewViewProvider {
	
	public static readonly viewType = 'sirenBrowser.requestTree';
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

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
}
