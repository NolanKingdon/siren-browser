import * as vscode from 'vscode';
import { Event } from '../events/Event';
import { EventType } from '../events/EventTypes';
import WebviewGenerator from './WebviewGenerator';

export class ContentWebView implements WebviewGenerator {
    
    public panel: vscode.WebviewPanel;
    public disposed: boolean = false;

    constructor() {
        this.panel = vscode.window.createWebviewPanel(
            'sirenContent',
            'Siren Browser',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );
        
        this.generateHtml();
    }

    sendEvent(event: Event): void {
        this.panel.webview.postMessage(event);
    }

    private generateHtml(): void {
        this.panel.webview.html = `
            <html>
                <body>
                    <div id='content-inputs'>
                        <input id='content-href' type='text' placeholder='Href' />
                        <input id='content-token' type='text' placeholder='Token' />
                        <button>Go</button>
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

            const originalToken = token.value;
            const originalHref = href.value;

            submit.addEventListener('click', event => {
                // This needs to update first. Don't want the href to try and update
                //  if we have token changes as well.
                if(originalToken !== token.value) {
                    vscode.postMessage({
                        type: ${EventType.contentTokenUpdate},
                        content: {
                            token: token.value,
                            href: href.value
                        }
                    })
                }

                if(originalHref !== href.value) {
                    vscode.postMessage({
                        type: ${EventType.contentHrefUpdate},
                        content: href.value
                    })
                }
            });

            window.addEventListener('message', event => {
                if(event.isTrusted) {
                    switch(event.data.type) {
                        case ${EventType.contentUpdated}:
                            const content = event.data.content;
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