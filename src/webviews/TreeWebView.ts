import * as vscode from 'vscode';
import { Event } from '../events/Event';
import { EventType } from '../events/EventTypes';
import WebviewGenerator from "./WebviewGenerator";

export class TreeWebView implements WebviewGenerator, vscode.WebviewViewProvider {
	
	public view?: vscode.WebviewView;
	public static readonly viewType = 'sirenBrowser.requestTree';
    private readonly _extensionUri: vscode.Uri;
    private readonly _eventCallback: (view: vscode.Webview) => void;

	constructor(extensionUri: vscode.Uri, eventCallback: (view: vscode.Webview) => void) {
        this._extensionUri = extensionUri;
        this._eventCallback = eventCallback;
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

		this.view = webviewView;
        this.generateHtml();
        this._eventCallback(this.view.webview);
	}

    sendEvent(event: Event) {
        this.view?.webview.postMessage(event);
    }

    private generateHtml(): void {
        if (this.view) {
            this.view.webview.html = `
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
            const newBtn = document.querySelector('button')

            newBtn.addEventListener('click', e => {
                vscode.postMessage(${
                    new Event(
                        EventType.treeNewRequest,
                        ''
                    ).toHtml()
                });
            });

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
        `;
    }
}