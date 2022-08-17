import { Renderable } from "./Renderable";
/**
 * This exists in a single file due to circular dependencies and difficult
 * to debug errors surrounding that.
 */


export class SirenBase {
    actions: SirenAction[];
    class: string[];
    entities: SirenEntity[];
    links: SirenLink[];
    properties: {[key: string]: any};
    rel: string;
    title: string;

    constructor(json: any) {
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
}

export class SirenEntity extends SirenBase implements Renderable {
    private json: string;
    private isSubEntity: boolean;

    constructor(json: any, isSubEntity: boolean = false) {
        super(json);
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
            <div class='siren-entity'>
                <h2>Class</h2>
                <p>[ ${this.class.map( c => ` ${c}`)} ] </p>
            </div>
            ${this.actions.length !== 0 ? this.actions.map( action => action.render()) : ``}
            ${this.entities.length !== 0 ? this.entities.map( entity => entity.render()) : ``}
            ${this.links.length !== 0 ? this.links.map( link => link.render()) : ``}
            ${Object.keys(this.properties).map( prop => `<p>${prop} -> ${this.properties[prop]}</p>`)}
        `;
    }

    private renderSubEntity(): string {
        return ``;
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

    public render(): string {
        return ``;
    }
}

export class SirenAction extends SirenBase implements Renderable {
    private name: string;
    private fields: string[];
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
        return ``;
    }
}