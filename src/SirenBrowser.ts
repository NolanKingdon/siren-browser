import * as vscode from 'vscode';
import { ContentUpdate, Event } from './events/Event';
import { EventType } from './events/EventTypes';
import { ContentWebView } from './webviews/ContentWebView';
import { TreeWebView } from './webviews/TreeWebView';
import  fetch from 'node-fetch';
import { TreeItem } from './elements/TreeItem';
import { SirenEntity } from './elements/SirenElements';

class SirenBrowser {
    private readonly _treeWorkspaceState: string = 'siren-browser_tree-state';
    private readonly _contentWorkspaceState: string = 'siren-browser_content-state';
    private _authToken: string;
    private _context: vscode.ExtensionContext;
    private _treeView: TreeWebView;
    private _contentView?: ContentWebView;
    private _treeItems: TreeItem[];
    private _currentEntity?: SirenEntity;
    private _raw: boolean;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._treeItems = this.generateTreeStateFromContext();
        this._treeView = this.generateTreeProvider();
        this._authToken = '';
        this._raw = false;
    }

    deactivate() {
        // TODO
    }

    private generateTreeStateFromContext(): TreeItem[] { 
        const state = this._context.workspaceState.get(this._treeWorkspaceState) as any[];
        const result: TreeItem[] = [];
        
        state.forEach(item => result.push(this.generatePreviousTreeState(item)));

        return result;
    }

    private generatePreviousTreeState(item: {_href: string, _children: any[], _isRoot: boolean}): TreeItem {
        const treeItem = new TreeItem(item._href, item._isRoot);

        if(item._children) {
            const children: TreeItem[] = [];

            item._children.forEach( child => children.push(this.generatePreviousTreeState(child)) );

            treeItem.setChildren(children);
        }

        return treeItem;
    }

    private generateTreeProvider(): TreeWebView {
        const _this: SirenBrowser = this; // Keep parent context
        const treeProvider = new TreeWebView(
            this._context.extensionUri,
            (view: vscode.WebviewView) => _this.generateTreeEvents(_this, view),
            this.renderAllTreeLinks()
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
    private generateTreeEvents(_this: SirenBrowser, view: vscode.WebviewView) {
        view.onDidChangeVisibility(e => {
            if(view.visible) {
                // Load everything again.
                _this.generateTreeStateFromContext();

                _this._treeView.sendEvent(
                    new Event(
                        EventType.treeLinkAdded,
                        _this.renderAllTreeLinks()
                    )
                );
            }
        });

        view.webview.onDidReceiveMessage(async (e: any) => {
            vscode.window.showInformationMessage(
                `Event recieved for TreeWebView. 
                    Type: ${EventType[e.type]}
                    Content: ${e.content}
                `
            );

            switch (e.type){
                case EventType.treeLinkClicked:
                    await this.tryFetchAndUpdateContent(e.content, 'GET');
                    break;
                case EventType.treeLinkRemoved:
                    for(let i=0; i<this._treeItems.length; i++) {
                        if(this._treeItems[i].isNode(e.content)) {
                            this._treeItems.splice(i, 1);
                            break;
                        } else if(this._treeItems[i].deleteChild(e.content)){
                            break;
                        }
                    }

                    this._context.workspaceState.update(this._treeWorkspaceState, this._treeItems);

                    this._treeView?.sendEvent(
                        new Event(
                            EventType.treeLinkAdded,
                            this.renderAllTreeLinks()
                        )
                    );

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

            const href = e.content.href;

            switch(e.type) {
                case EventType.contentTokenUpdate:
                    this._authToken = e.content.token;
                    const unchangedHref = e.content.href;
                    
                    // Reload once the new token is assigned
                    await this.tryFetchAndUpdateContent(unchangedHref, 'GET');

                    break;
                case EventType.contentHrefUpdate:
                case EventType.contentLinkClicked:
                    if (await this.tryFetchAndUpdateContent(href, 'GET')) {

                        const parent = this.getTreeItemByHref(e.content.parent);

                        if (parent) {
                            parent.addChild(e.content.href);
                        } else {
                            this._treeItems.push(new TreeItem(href));
                        }
                        
                        // For when we re-load things
                        this._context.workspaceState.update(this._treeWorkspaceState, this._treeItems);

                        const html = this.renderAllTreeLinks();

                        this._treeView.sendEvent(
                            new Event(
                                EventType.treeLinkAdded,
                                html
                            )
                        );
                    }

                    break;
                case EventType.contentActionClicked:
                    const formData = e.content.form;
                    const method = e.content.method;
                    
                    if (await this.tryFetchAndUpdateContent(href, method, formData)) {
                        this._treeView.sendEvent(
                            new Event(
                                EventType.treeLinkAdded,
                                this.renderAllTreeLinks()
                            )
                        );
                    }

                    break;
                case EventType.contentRawToggle:
                    this._raw = e.content.checked as boolean;
                    this.updateContent(e.content.href);
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

    private async tryFetchAndUpdateContent(
        href: string, 
        method: string, 
        body?: any
    ): Promise<boolean> {
        const options: any = { 
            method,
            headers: {
                'authorization': `Bearer ${this._authToken}`
            }
        };

        if(body) {
            if(method.toLowerCase() === 'get') {
                // Append as queries to the href
                href += '?';
                Object.keys(body).forEach( key => href += `${key}=${body[key]}&`);
                href.slice(0, -1); // Remove last &
            } else {
                // Append body to options
                options.body = body;
            }
        }

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

        // Store entity globally so we can just convert to JSON with a raw switch.
        this._currentEntity = new SirenEntity(res);

        this.updateContent(href);

        return true;
    }

    private updateContent(href: string): void {
        if(!this._currentEntity) {
            return;
        }

        this._contentView?.sendEvent(
            new Event(
                EventType.contentUpdated,
                new ContentUpdate(
                    href,
                    '',
                    this._raw 
                        ? this._currentEntity.getRaw() 
                        : this._currentEntity.render()
                )
            )
        );
    }
}

export default SirenBrowser;