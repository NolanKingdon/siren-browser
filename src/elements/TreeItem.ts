import { Event } from "../events/Event";
import { EventType } from "../events/EventTypes";
import { Renderable } from "./Renderable";

export class TreeItem implements Renderable {

    private _href: string;

    constructor(href: string) {
        this._href = href;
    }

    public render(): string {
        return `
            <p onclick='(function() {
                vscode.postMessage(
                    ${new Event(
                        EventType.treeLinkClicked,
                        this._href
                    ).toHtml()}
                );
            })()'>${this._href}</p>
        `;
    }
}