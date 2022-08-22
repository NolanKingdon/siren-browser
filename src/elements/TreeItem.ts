import { Event } from "../events/Event";
import { EventType } from "../events/EventTypes";
import { Renderable } from "./Renderable";

export class TreeItem implements Renderable {
    private _href: string;
    private _children: TreeItem[];
    private _isRoot: boolean;

    constructor(href: string, isRoot: boolean = true) {
        this._href = href;
        this._children = [];
        this._isRoot = isRoot;
    }

    public addChild(href: string): void {
        this._children.push(new TreeItem(href, false));
    }

    public setChildren(children: TreeItem[]) {
        this._children = children;
    }

    public deleteChild(href: string): boolean {
        for (let i = 0; i < this._children.length; i++) {
            if(this._children[i].isNode(href)) {
                this._children.splice(i,1);
                return true;
            } 

            if(this._children[i].deleteChild(href)) {
                return true;
            }
        }

        return false;
    }

    public isNode(href: string): boolean {
        return this._href === href;
    }

    public getNodeByHref(href: string): TreeItem | null {
        if(this.isNode(href)) {
            return this;
        }

        for(let child of this._children) {
            const node = child.getNodeByHref(href);

            if(node) {
                return node;
            }
        }

        return null;
    }

    public render(): string { 
        return `
            <div class='siren-tree-node'>
                <div class='flex-row-space-between'>
                    <p class='siren-tree-node-text' onclick='(() => {
                        vscode.postMessage(
                            ${new Event(
                                EventType.treeLinkClicked,
                                this._href
                            ).toHtml()}
                        );
                        })()'>${this._href}</p>
                    </p>
                    <button 
                        class='siren-browser-icon-button'
                        onclick='(() => { 
                            vscode.postMessage(
                                ${
                                    new Event(
                                        EventType.treeLinkRemoved,
                                        this._href
                                    ).toHtml()
                                }
                            )
                        })()'
                    >X</button>
                </div>
                ${ this._children ? this._children.map( child => child.render() ).join('') : ``}
            </div>
        `;
    }
}