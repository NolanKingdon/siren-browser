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

    public getNodeByHref(href: string): TreeItem | null {
        if(this._href === href) {
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
                    <p onclick='(() => {
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