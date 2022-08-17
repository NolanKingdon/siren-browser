import * as vscode from 'vscode';
import { ContentUpdate, Event } from './events/Event';
import { EventType } from './events/EventTypes';
import { ContentWebView } from './webviews/ContentWebView';
import { TreeWebView } from './webviews/TreeWebView';
import  fetch from 'node-fetch';
import { TreeItem } from './elements/TreeItem';

class SirenBrowser {
    private _context: vscode.ExtensionContext;
    private _treeView?: TreeWebView;
    private _contentView?: ContentWebView;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._treeView = this.generateTreeProvider();
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
        view.onDidReceiveMessage(async (e: any) => {
            vscode.window.showInformationMessage(
                `Event recieved for TreeWebView. 
                    Type: ${EventType[e.type]}
                    Content: ${e.content}
                `
            );

            switch (e.type){
                case EventType.treeLinkClicked:
                    await this.fetchAndUpdateContent(e.content);
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
        view.panel.webview.onDidReceiveMessage(async (e: any) => {
            vscode.window.showInformationMessage(
                `Event recieved for ContentWebView. 
                    Type: ${EventType[e.type]}
                    Content: ${e.content}
                `
            );

            switch(e.type) {
                case EventType.contentHrefUpdate:
                    // TODO - Tree HTML Serializer
                    // TODO - some way to hold this in state so when we
                    //      nav off the actionBar, it sticks around.
                    //      Preferably when you close/re-open vscode
                    const href = e.content.href;
                    const html = new TreeItem(href);

                    this._treeView?.sendEvent(
                        new Event(
                            EventType.treeLinkAdded,
                            html.render()
                        )
                    );
                    
                    await this.fetchAndUpdateContent(href);

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

    private async fetchAndUpdateContent(href: string): Promise<void> {
        const res: any = await fetch(href)
            .then(res => res.json())
            .catch(e => console.log(e));
        
        this._contentView?.sendEvent(
            new Event(
                EventType.contentUpdated,
                new ContentUpdate(
                    href,
                    '',
                    // TODO -> Actual Siren Stuff. This is based on pokeapi
                    `
                        <h1>${res.name}</h1>
                        <img src='${res.sprites.front_default}' alt='${res.name} Sprite'/>
                    `
                )
            )
        );
    }
}

export default SirenBrowser;