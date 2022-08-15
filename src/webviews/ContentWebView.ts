import * as vscode from 'vscode';
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
        
        this.generateHtml();
    }

    sendEvent(event: any): void {
        throw new Error('Method not implemented.');
    }

    private generateHtml(): void {
        this.panel.webview.html = `
            <html>
                <body>
                    <h1>placeholder</h1>
                </body>
            </html>
        `;
    }
}