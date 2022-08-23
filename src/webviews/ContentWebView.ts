import * as vscode from 'vscode';
import { Event } from '../events/Event';
import { EventType } from '../events/EventTypes';
import WebviewGenerator from './WebviewGenerator';

export class ContentWebView implements WebviewGenerator {
    
    public panel: vscode.WebviewPanel;
    public disposed: boolean = false;
    private extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.panel = vscode.window.createWebviewPanel(
            'sirenContent',
            'Siren Browser',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        this.extensionUri = extensionUri; 
        
        this.generateHtml();
    }

    sendEvent(event: Event): void {
        this.panel.webview.postMessage(event);
    }

    private generateHtml(): void {
        const generalStylesPath = vscode.Uri.joinPath(
            this.extensionUri,
            'src',
            'styles',
            'styles.general.css'
        );
        const contentStylesPath = vscode.Uri.joinPath(
            this.extensionUri,
            'src',
            'styles',
            'styles.content.css'
        );
        const generalStylesUri = this.panel.webview.asWebviewUri(generalStylesPath);
        const contentStylesUri = this.panel.webview.asWebviewUri(contentStylesPath);

        this.panel.webview.html = `
            <html>
                <head>
                    <link href=${generalStylesUri} rel='stylesheet' />
                    <link href=${contentStylesUri} rel='stylesheet' />
                </head>
                <body>
                    <div id='content-inputs'>
                        <input id='content-href' class='siren-input' type='text' placeholder='Href' />
                        <input id='content-token' class='siren-input' type='text' placeholder='Token' />
                        <button id='content-button' class="siren-browser-button">GET</button>
                        <input id='content-raw' type='checkbox' /><label class='siren-input-label'>Raw</label>
                    </div>
                    <div id='content-container'></div>
                    <script>${this.generateHtmlEvents()}</script>
                </body>
            </html>
        `;
    }

    private generateHtmlEvents(): string {
        return /*javascript*/`
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('content-container');
            const submit = document.querySelector('#content-inputs button');
            const token = document.querySelector('#content-token');
            const href = document.querySelector('#content-href');
            const raw = document.querySelector('#content-raw');
            let originalToken = '';
            let parentHref = '';

            submit.addEventListener('click', event => {
                // This needs to update first. Don't want the href to try and update
                //  if we have token changes as well.
                if(originalToken !== token.value) {
                    originalToken = token.value;
                    vscode.postMessage({
                        type: ${EventType.contentTokenUpdate},
                        content: {
                            token: token.value,
                            href: href.value
                        }
                    })
                }

                if(parentHref !== href.value) {
                    vscode.postMessage({
                        type: ${EventType.contentHrefUpdate},
                        content: {
                            href: href.value,
                            parent: '' // If we enter an entirely new href, it's not a descendent
                        }
                    });
                }
            });

            raw.addEventListener('click', () => {
                vscode.postMessage({
                    type: ${EventType.contentRawToggle},
                    content: {
                        checked: raw.checked,
                        href: href.value
                    }
                });
            });

            window.addEventListener('message', event => {
                if(event.isTrusted) {
                    switch(event.data.type) {
                        case ${EventType.contentUpdated}:
                            const content = event.data.content;
                            parentHref = href.value;
                            href.value = content.href;
                            container.innerHTML = content.html;
                            break;
                        default:
                            break;
                    }
                }
            });
        `;
    }
}