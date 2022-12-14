import { EventType } from "./EventTypes";

export class Event {
    type: EventType;
    content: any;

    constructor(type: EventType, content: any) {
        this.type = type;
        this.content = content;
    }

    toHtml(): string {
        return JSON.stringify(this);
    }
};

export class ContentUpdate {
    href: string;
    token: string;
    html: string;

    constructor(href: string, token: string, html: string) {
        this.href = href;
        this.token = token;
        this.html = html;
    }
}
