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
}

interface FeedContext {
    messageId: string
}

export class HtmlMessage extends Component<HtmlMessageData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "message"
        ],
        "properties": {
            "message": {
                "$id": "#/properties/message",
                "type": "string",
                "title": "Html message",
                "default": "<h1>Default message</h1>"
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

        dispatchNextComponentEvent(component.nextComponents);
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
    url: string,
    alt: string
}

export class ImageMessage extends Component<ImageMessageData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "url",
            "alt"
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

        dispatchNextComponentEvent(component.nextComponents);
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
