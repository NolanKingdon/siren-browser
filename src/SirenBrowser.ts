import * as vscode from 'vscode';
import { ContentUpdate, Event } from './events/Event';
import { EventType } from './events/EventTypes';
import { ContentWebView } from './webviews/ContentWebView';
import { TreeWebView } from './webviews/TreeWebView';

class SirenBrowser {
    private _context: vscode.ExtensionContext;
    private _treeView?: TreeWebView;
    private _contentView?: ContentWebView;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        const treeProvider = this.generateTreeProvider();
        this._treeView = treeProvider;
    }

    deactivate() {
        // TODO
    }

    private generateTreeProvider(): TreeWebView {
        const _this: SirenBrowser = this; // Keep parent context
        const treeProvider = new TreeWebView(
            this._context.extensionUri,
            (view: vscode.Webview) => _this.generateTreeEvents(_this, view)
        );
        this._context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                TreeWebView.viewType,
                treeProvider
            )
        );

        return treeProvider;
    }

    /**
     * Callback for TreeWebView to call when resolveWebviewView is called.
     * @param _this context of SirenBrowser to modify state when used as callback
     */
    private generateTreeEvents(_this: SirenBrowser, view: vscode.Webview) {
        view.onDidReceiveMessage((e: any) => {
            vscode.window.showInformationMessage(
                `Event recieved for TreeWebView. 
                    Type: ${EventType[e.type]}
                    Content: ${e.content}
                `
            );

            switch (e.type){
                case EventType.treeLinkAdded:
                    break;
                case EventType.treeLinkClicked:
                    break;
                case EventType.treeLinkRemoved:
                    break;
                case EventType.treeNewRequest:
                    if(!_this._contentView || _this._contentView.disposed) {
                        _this._contentView = _this.createContentView();
                    }
                    
                    _this._contentView?.sendEvent(
                        new Event(
                            EventType.contentUpdated,
                            new ContentUpdate(
                                '',
                                '',
                                '<h1>New</h1>'
                            ) 
                        )
                    );

                    break;
                default:
                    break;
            }
        });
    }

    private generateContentViewEvents(view: ContentWebView) {
        view.panel.webview.onDidReceiveMessage((e: any) => {
            vscode.window.showInformationMessage(
                `Event recieved for ContentWebView. 
                    Type: ${EventType[e.type]}
                    Content: ${e.content}
                `
            );

            switch(e.type) {
                case EventType.contentHrefUpdate:
                    // TODO - Tree HTML Serializer
                    const html = `
                        <p>${e.content.href}</p>
                    `;

                    this._treeView?.sendEvent(
                        new Event(
                            EventType.treeLinkAdded,
                            html
                        )
                    );
                   

                    break;
                case EventType.contentLinkClicked:
                    break;
                case EventType.contentUpdated:
                    break;
                default:
                    break;
            }
        });
    }

    private createContentView(): ContentWebView {
        const view = new ContentWebView();

        view.panel.onDidDispose(() => {
            view.disposed = true;
        });
        
        this.generateContentViewEvents(view);

        return view;
    }
}

export default SirenBrowser;