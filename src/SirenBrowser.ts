import * as vscode from 'vscode';
import { ContentUpdate, Event } from './events/Event';
import { EventType } from './events/EventTypes';
import { ContentWebView } from './webviews/ContentWebView';
import { TreeWebView } from './webviews/TreeWebView';
import  fetch from 'node-fetch';
import { TreeItem } from './elements/TreeItem';
import { SirenEntity } from './elements/SirenElements';

class SirenBrowser {
    private _authToken: string;
    private _context: vscode.ExtensionContext;
    private _treeView: TreeWebView;
    private _contentView?: ContentWebView;
    private _treeItems: TreeItem[];

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._treeView = this.generateTreeProvider();
        this._authToken = '';
        this._treeItems = [];
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
                    await this.tryFetchAndUpdateContent(e.content);
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
                case EventType.contentTokenUpdate:
                    this._authToken = e.content.token;
                    const unchangedHref = e.content.href;
                    
                    // Reload once the new token is assigned
                    await this.tryFetchAndUpdateContent(unchangedHref);

                    break;
                case EventType.contentHrefUpdate:
                case EventType.contentLinkClicked:
                    // TODO - some way to hold this in state so when we
                    //      nav off the actionBar, it sticks around.
                    //      Preferably when you close/re-open vscode
                    const href = e.content.href;
                    if (await this.tryFetchAndUpdateContent(href)) {

                        const parent = this.getTreeItemByHref(e.content.parent);

                        if (parent) {
                            parent.addChild(e.content.href);
                        } else {
                            this._treeItems.push(new TreeItem(href));
                        }

                        const html = this.renderAllTreeLinks();

                        this._treeView.sendEvent(
                            new Event(
                                EventType.treeLinkAdded,
                                html
                            )
                        );
                    }

                    break;
                case EventType.contentUpdated:
                    break;
                default:
                    break;
            }

        });
    }

    private getTreeItemByHref(href: string): TreeItem | null {
        for(let item of this._treeItems) {
            const node = item.getNodeByHref(href);

            if(node) {
                return node;
            }
        }

        return null;
    }

    private createContentView(): ContentWebView {
        const view = new ContentWebView(this._treeView.extensionUri);

        view.panel.onDidDispose(() => {
            view.disposed = true;
        });
        
        this.generateContentViewEvents(view);

        return view;
    }

    private renderAllTreeLinks(): string {
        let result = '';

        for(let treeItem of this._treeItems) {
            result += treeItem.render();
        }

        return result;
    }

    private async tryFetchAndUpdateContent(href: string): Promise<boolean> {
        const options = this._authToken 
            ? { 
                headers: {
                    'authorization': `Bearer ${this._authToken}`
                }
             } 
            : {};
        const res: any = await fetch(href, options)
            .then(res => {
                if(res.ok) {
                    return res.json();
                } else {
                    throw new Error(`Erorr encountered during request: ${res.status} ${res.statusText}`);
                }
            })
            .catch(e => {
                vscode.window.showErrorMessage(
                    e.message
                );

                return e;
            });
        
        if(res instanceof Error) {
            return false;
        }

        const entity = new SirenEntity(res);

        this._contentView?.sendEvent(
            new Event(
                EventType.contentUpdated,
                new ContentUpdate(
                    href,
                    '',
                    entity.render()
                )
            )
        );

        return true;
    }
}

export default SirenBrowser;