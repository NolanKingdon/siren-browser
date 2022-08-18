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
        const generalStylesPath = vscode.Uri.joinPath(
            this._extensionUri,
            'src',
            'styles',
            'styles.general.css'
        );
        const treeStylesPath = vscode.Uri.joinPath(
            this._extensionUri,
            'src',
            'styles',
            'styles.tree.css'
        );

        const treeStylesUri = this.view?.webview.asWebviewUri(treeStylesPath);
        const generalStylesUri = this.view?.webview.asWebviewUri(generalStylesPath);

        if (this.view) {
            this.view.webview.html = `
                <html style="height: 96%;">
                    <link href=${treeStylesUri} rel="stylesheet" />
                    <link href=${generalStylesUri} rel="stylesheet" />
                    <body style="height: 96%;">
                        <div id='tree-control-container'>
                            <button id='tree-new-request' class='siren-browser-button'>New Request</button>
                        </div>
                        <h3>History</h3>
                        <div id="tree-container"></div>
                        <script>${this.generateHtmlEvents()}</script>
                    </body>
                </html>
            `;
        }
    }

    private generateHtmlEvents(): string {
        return /*javascript*/`
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('tree-container');
            const newBtn = document.querySelector('#tree-new-request')

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