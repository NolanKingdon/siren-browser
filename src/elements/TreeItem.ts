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

    public render(): string { // TODO - pull CSS into seperate file
        return `
            <div class='siren-tree-node' style="border-left: 1px solid cyan; padding: 0.25em 0 0 1em; margin: 0;">
                <p onclick='(function() {
                    vscode.postMessage(
                        ${new Event(
                            EventType.treeLinkClicked,
                            this._href
                        ).toHtml()}
                    );
                    })()'>${this._href}</p>
                </p>
                ${ this._children ? this._children.map( child => child.render() ).join('') : ``}
            </div>
        `;
    }
}