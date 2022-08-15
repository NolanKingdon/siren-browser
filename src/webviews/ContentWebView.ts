import * as vscode from 'vscode';
import { Event } from '../events/Event';
import { EventType } from '../events/EventTypes';
import WebviewGenerator from './WebviewGenerator';

export class ContentWebView implements WebviewGenerator {
    
    panel: vscode.WebviewPanel;

    constructor() {
        this.panel = vscode.window.createWebviewPanel(
            'sirenContent',
            'Siren Content',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );
        
        this.loadEventHandlers();
        this.generateHtml();
    }

    sendEvent(event: Event): void {
        this.panel.webview.postMessage(event);
    }

    private generateHtml(): void {
        this.panel.webview.html = `
            <html>
                <body>
                    <div id='content-container'>placeholder</h1>
                    <script>${this.generateHtmlEvents()}</script>
                </body>
            </html>
        `;
    }

    private generateHtmlEvents(): string {
        return `
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('content-container');

            window.addEventListener('message', event => {
                            if(event.isTrusted) {
                                switch(event.data.type) {
                                    case ${EventType.contentUpdated}:
                                        container.innerHTML = event.data.content;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        })

            setTimeout(
                () => vscode.postMessage(
                    ${new Event(EventType.contentLinkClicked, 'Cool').toHtml()}
                ),
                5000
            );
        `;
    }

    private loadEventHandlers(): void {
        this.panel.webview.onDidReceiveMessage((e: any) => {
            vscode.window.showInformationMessage(
                `Event recieved for TreeWebView. 
                    Type: ${EventType[e.type]}
                    Content: ${e.content}
                `
            );
        });
    }
}