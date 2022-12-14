import * as vscode from 'vscode';
import { Event } from '../events/Event';
import { EventType } from '../events/EventTypes';
import WebviewGenerator from "./WebviewGenerator";

export class TreeWebView implements WebviewGenerator, vscode.WebviewViewProvider {
	
	public view?: vscode.WebviewView;
    public readonly extensionUri: vscode.Uri;
	public static readonly viewType = 'sirenBrowser.requestTree';
    private readonly _eventCallback: (view: vscode.WebviewView) => void;
    private readonly _initialState: string;

	constructor(
        extensionUri: vscode.Uri, 
        eventCallback: (view: vscode.WebviewView) => void,
        initialState: string = ''
    ) {
        this.extensionUri = extensionUri;
        this._eventCallback = eventCallback;
        this._initialState = initialState;
    }

	resolveWebviewView(
		webviewView: vscode.WebviewView, 
		context: vscode.WebviewViewResolveContext<unknown>, 
		token: vscode.CancellationToken
	): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this.extensionUri
			]
		};
        
		this.view = webviewView;
        this.generateHtml();
        this._eventCallback(this.view);

        if(this._initialState.length !== 0) {
            this.sendEvent(
                new Event(
                    EventType.treeLinkAdded,
                    this._initialState
                )
            );
        }

	}

    sendEvent(event: Event) {
        this.view?.webview.postMessage(event);
    }

    private generateHtml(): void {
        const path = process.env.DEVELOPMENT ?
            'src\\styles' :
            'dist\\src\\styles';

        const generalStylesPath = vscode.Uri.joinPath(
            this.extensionUri,
            path,
            'styles.general.css'
        );
        const treeStylesPath = vscode.Uri.joinPath(
            this.extensionUri,
            path,
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