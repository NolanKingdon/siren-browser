import * as vscode from 'vscode';
import { Event } from '../events/Event';
import { EventType } from '../events/EventTypes';
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

		this._view = webviewView;
        this.loadEventHandlers();
        this.generateHtml();
	}

    sendEvent(event: Event) {
        this._view?.webview.postMessage(event);
    }

    private generateHtml(): void {
        if (this._view) {
            this._view.webview.html = `
                <html>
                    <body>
                        <button>New Request</button>
                        <div id="tree-container">Initial</div>
                        <script>${this.generateHtmlEvents()}</script>
                    </body>
                </html>
            `;
        }
    }

    private generateHtmlEvents(): string {
        return `
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('tree-container');

            window.addEventListener('message', event => {
                            if(event.isTrusted) {
                                console.log(event);
                                switch(event.data.type) {
                                    case ${EventType.treeLinkAdded}:
                                        container.innerHTML = event.data.content;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        })

            setTimeout(
                () => vscode.postMessage(${new Event(EventType.treeLinkClicked, 'Cool').toHtml()}),
                5000
            );
        `;
    }

    private loadEventHandlers(): void {
        this._view?.webview.onDidReceiveMessage((e: any) => {
            vscode.window.showInformationMessage(
                `Event recieved for TreeWebView. 
                    Type: ${EventType[e.type]}
                    Content: ${e.content}
                `
            );
        });
    }
}