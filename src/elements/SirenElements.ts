import { Event } from "../events/Event";
import { EventType } from "../events/EventTypes";
import { Renderable } from "./Renderable";
/**
 * This exists in a single file due to circular dependencies and difficult
 * to debug errors surrounding that.
 */

let self = ''; // Thanks, I hate it.

export class SirenBase {
    actions: SirenAction[];
    class: string[];
    entities: SirenEntity[];
    links: SirenLink[];
    properties: {[key: string]: any};
    rel: string[];
    title: string;

    constructor(json: any, isRootEntity: boolean = false) {
        if(isRootEntity) {
            self = this.getSelf(json);
        }

        this.actions = (json['actions'] || []).map(
            (a: any) => new SirenAction(a)
        );
        this.links = (json['links'] || []).map(
            (l: any) => new SirenLink(l)
        );
        this.class = json['class'] || [];
        this.properties = json['properties'] || {};
        this.title = json['title'] || '';
        // required for sub-entities
        this.rel = json['rel'] || [];
        // sub entities can be entities or links
        // if it has an `href` it's a link, otherwise it's an entity
        this.entities = (json['entities'] || []).map(
            (e: any) => e.href ? new SirenLink(e) : new SirenEntity(e, true)
        );
    }

    private getSelf(json: any): string {
        if(json.links && json.links.length > 0) {
            for(let link of json.links) {
                if(link.rel.includes('self')) {
                    return link.href;
                }
            }
        }

        return self; 
    }
}

export class SirenEntity extends SirenBase implements Renderable {
    private json: string;
    private isSubEntity: boolean;

    constructor(json: any, isSubEntity: boolean = false) {
        super(json, !isSubEntity);
        this.json = JSON.stringify(json);
        this.isSubEntity = isSubEntity;
    }

    public getRaw() {
        return this.json;
    }

    public render(): string {
        return this.isSubEntity
            ? this.renderSubEntity()
            : this.renderBaseEntity();

    };

    private renderBaseEntity(): string {
        return `
            <div class='content-sub-container'>
                <h2>Class</h2>
                <div class='content-indented'>
                    <p>[ ${this.class.map( c => ` ${c}`)} ] </p>
                </div>
            </div>
            ${this.renderEntityContents()}
        `;
    }

    private renderSubEntity(): string {
        return `
            <div class='content-sub-entity-container'>
                <h3>Sub Class</h3>
                <div class='content-indented'>
                    <p>[ ${this.class.map( c => ` ${c}`)} ]</p>
                    ${this.renderEntityContents()}
                </div>
            </div>
        `;
    }

    private renderEntityContents(): string {
        return `
            ${
                this.links.length !== 0 
                ? `
                    <div class='content-sub-container'>
                        <h2>Links</h2>
                        <div class='content-indented'>
                            ${this.links.map( link => link.render(self)).join('')}
                        </div>
                    </div>
                ` 
                : ``
            }
            ${
                this.actions.length !== 0 
                ? `
                        <div class='content-sub-container'>
                            <h2>Actions</h2>
                            <div class='content-indented'>
                                ${this.actions.map( action => action.render()).join('')}
                            </div>
                        </div>
                `
                : ``
            }
            ${
                this.entities.length !== 0 
                    ? `
                        <div class='content-sub-container'>
                            <h2>Sub Entities</h2>
                            ${this.entities.map( entity => entity.render()).join('')}
                        </div>
                    `
                    : ``}
            ${
                this.properties.length !== 0
                    ? `
                        <div class='content-sub-container'>
                            <h2>Properties</h2>
                            <table class='content-table'>
                                <tr>
                                    <th>Property</th>
                                    <th>Value</th>
                                </tr>
                            ${
                                Object.keys(this.properties)
                                    .map(prop => `
                                        <tr>
                                            <td>${prop}</td> 
                                            <td>${this.properties[prop]}</td>
                                        </tr>
                                    `)
                                    .join('')
                            }
                            </table>
                        </div>
                    `
                    : ``
            }
        `;
    }
}

export class SirenLink extends SirenBase implements Renderable {
    private href: string;
    private type: string;

    constructor(json: any) {
        super(json);

        // required
        this.href = json['href'] || '';
        // optional
        this.type = json['type'] || '';
    }

    public render(parent?: string): string {
        return `
            <p>[ ${
                this.rel.map(
                    r => `
                        <span 
                            class='content-rel-link'
                            onclick='(function(){
                                vscode.postMessage(${
                                    new Event(
                                        EventType.contentLinkClicked,
                                        {
                                            href: this.href,
                                            parent: parent || ''
                                        }
                                    ).toHtml()
                                })
                            })()'
                        >
                            ${r}
                        </span>
                    `
                )
            } ]</p>
        `;
    }
}

export class SirenAction extends SirenBase implements Renderable {
    private name: string;
    private fields: { type: string, name: string, value: any}[];
    private href: string;
    private method: string;
    private type: string;

    constructor(json: any) {
        super(json);
        // required
        this.name = json['name'] || '';
        this.href = json['href'] || '';
        // optional
        this.method = json['method'] || 'GET';
        this.type = json['type'] || 'application/x-www-form-urlencoded;charset=UTF-8';
        this.fields = json['fields'] || [];
    }

    public render(): string {
        // TODO -> Following these
        return `
            ${ 
                this.fields.length !== 0
                    ? `
                        <h3>${this.name}${this.method ? ` - ${this.method}` : ``}</h3>
                        <table class='content-table'>
                            <tr>
                                <th>Field</th>
                                <th>Value</th>
                            </tr>
                            ${this.fields.map( field => `
                                <tr>
                                    <td>${field.name}</td>
                                    <td>
                                        <input
                                            id='${this.name}-${this.method}-${field.name}' 
                                            class='siren-input'
                                            type='text'
                                            value=${field.value} 
                                        />
                                </tr>
                            `).join('')}
                            <tr>
                                <td colspan="100%">
                                    <button style="width: 100%" class='siren-browser-button'>Submit</button>
                                </td>
                            </tr>
                        </table>
                    `
                    : ``
            }
        `;
    }
}