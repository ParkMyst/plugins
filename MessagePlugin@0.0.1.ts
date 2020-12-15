import {
    BuiltInEvents,
    Component,
    ComponentData,
    createFeed,
    dispatchNextComponentEvent,
    getComponentInformation,
    JSONSchema7,
    OutputTemplates,
    PlayerPermission,
    registerComponent,
    removeFeed, subscribeToEvent, unsubscribeFromEvent, updateStatus,
    useState
} from "./library/parkmyst-1";

interface HtmlMessageData extends ComponentData {
    message: string
    nextComponent: number
}

interface FeedContext {
    messageId: string
}

export class HtmlMessage extends Component<HtmlMessageData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "definitions": {
            "component": {
                "$id": "#/definitions/component",
                "type": "number",
                "title": "Next component",
                "default": -1,
                "minimum": -1,
                "format": "parkmyst-id"
            }
        },
        "required": [
            "message",
            "nextComponent"
        ],
        "properties": {
            "message": {
                "$id": "#/properties/message",
                "type": "string",
                "title": "Html message",
                "default": "<h1>Default message</h1>"
            },
            "nextComponent": {
                "$ref": "#/definitions/component"
            }
        }
    };

    doCleanUpOnCompletion = false;
    defaultCleanUpEnabled = false;

    componentOutputTemplate: OutputTemplates = {
        message: {
            example: {
                message: "Example message!"
            },
            display: `<div>
    <p>{{message}}</p>
</div>`,
            permission: PlayerPermission.User
        }
    };

    componentStartEvent() {
        const component = getComponentInformation<HtmlMessageData>();
        const [, setCtx] = useState<FeedContext>();

        const feedId = createFeed("message", {
            message: component.data.message
        });
        setCtx({ messageId: feedId });

        dispatchNextComponentEvent(component.data.nextComponent);
    }

    componentCleanUp() {
        const [ctx,] = useState<FeedContext>();
        removeFeed(ctx.messageId);
        updateStatus("idle");
        subscribeToEvent(BuiltInEvents.ComponentStart)
        unsubscribeFromEvent(BuiltInEvents.ComponentReset);
        unsubscribeFromEvent(BuiltInEvents.ComponentEnd);
    }

    componentCompleted() {

    }
}

registerComponent(new HtmlMessage());

interface ImageMessageData extends ComponentData {
    url: string
    alt: string
    nextComponent: number
}

export class ImageMessage extends Component<ImageMessageData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "definitions": {
            "component": {
                "$id": "#/definitions/component",
                "type": "number",
                "title": "Next component",
                "default": -1,
                "minimum": -1,
                "format": "parkmyst-id"
            }
        },
        "required": [
            "url",
            "alt",
            "nextComponent"
        ],
        "properties": {
            "url": {
                "$id": "#/properties/url",
                "type": "string",
                "format": "url",
                "title": "Url of image",
                "default": "http://placehold.jp/50x50.png"
            },
            "alt": {
                "$id": "#/properties/alt",
                "type": "string",
                "title": "Alternative text to url",
                "default": "http://placehold.jp/50x50.png"
            },
            "nextComponent": {
                "$ref": "#/definitions/component"
            }
        }
    };

    doCleanUpOnCompletion = false;
    defaultCleanUpEnabled = false;

    componentOutputTemplate: OutputTemplates = {
        imageMessage: {
            example: {
                url: "http://placehold.jp/50x50.png",
                alt: "placeholder image 50x50"
            },
            display: `<div>
    <img style="width: 100%" src="{{url}}" alt="{{alt}}">
</div>`,
            permission: PlayerPermission.User
        }
    };

    componentStartEvent() {
        const component = getComponentInformation<ImageMessageData>();
        const [, setCtx] = useState<FeedContext>();

        const feedId = createFeed("imageMessage", {
            url: component.data.url,
            alt: component.data.alt
        });
        setCtx({ messageId: feedId });

        dispatchNextComponentEvent(component.data.nextComponent);
    }

    componentCleanUp() {
        const [ctx,] = useState<FeedContext>();
        removeFeed(ctx.messageId);
        updateStatus("idle");
        subscribeToEvent(BuiltInEvents.ComponentStart)
        unsubscribeFromEvent(BuiltInEvents.ComponentReset);
        unsubscribeFromEvent(BuiltInEvents.ComponentEnd);
    }

    componentCompleted() {

    }

}

registerComponent(new ImageMessage());
