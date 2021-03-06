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
    removeFeed,
    subscribeToEvent,
    unsubscribeFromEvent,
    updateStatus
} from "./library/parkmyst-1";

interface HtmlMessageData extends ComponentData {
    message: string
}

interface MessageState {
    messageId: string
}

export class SimpleMessage extends Component<HtmlMessageData, MessageState> {

    description = "SimpleMessage component allows you to show basic text message to the user.\n" +
        "Will signal the next components and stays active.";

    schema: JSONSchema7 = {
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
                "title": "Message",
                "default": "Default message"
            }
        }
    };

    doCleanUpOnCompletion = false;
    defaultCleanUpEnabled = false;

    outputTemplates: OutputTemplates = {
        simpleMessage: {
            example: {
                message: "Example message!"
            },
            template: `<p>{{message}}</p>`
        }
    };

    componentStartEvent = () => {
        const component = getComponentInformation<HtmlMessageData>();
        const [, setCtx] = this.useState();

        const feedId = createFeed("simpleMessage", {
            message: component.data.message
        });
        setCtx({ messageId: feedId });

        dispatchNextComponentEvent(component.nextComponents);
    }

    componentCleanUp = () => {
        const [ctx,] = this.useState();
        removeFeed(ctx.messageId);
        updateStatus("idle");
        subscribeToEvent(BuiltInEvents.ComponentStart)
        unsubscribeFromEvent(BuiltInEvents.ComponentReset);
        unsubscribeFromEvent(BuiltInEvents.ComponentEnd);
    }

    componentCompleted = () => {

    }
}

registerComponent(new SimpleMessage());

export class HtmlMessage extends Component<HtmlMessageData, MessageState> {

    description = "HtmlMessage component allows you to show custom html content to the user.\n" +
        "Will signal the next components and stays active.";

    schema: JSONSchema7 = {
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

    outputTemplates: OutputTemplates = {
        htmlMessage: {
            example: {
                message: "<p>Example message!</p>"
            },
            template: `{{message}}`
        }
    };

    componentStartEvent = () => {
        const component = getComponentInformation<HtmlMessageData>();
        const [, setCtx] = this.useState();

        const feedId = createFeed("htmlMessage", {
            message: component.data.message
        });
        setCtx({ messageId: feedId });

        dispatchNextComponentEvent(component.nextComponents);
    }

    componentCleanUp = () => {
        const [ctx,] = this.useState();
        removeFeed(ctx.messageId);
        updateStatus("idle");
        subscribeToEvent(BuiltInEvents.ComponentStart)
        unsubscribeFromEvent(BuiltInEvents.ComponentReset);
        unsubscribeFromEvent(BuiltInEvents.ComponentEnd);
    }

    componentCompleted = () => {

    }
}

registerComponent(new HtmlMessage());

interface ImageMessageData extends ComponentData {
    url: string,
    alt: string
}

export class ImageMessage extends Component<ImageMessageData, MessageState> {

    description = "HtmlMessage component allows you to show image content to the user.\n" +
        "Will signal the next components and stays active.";

    schema: JSONSchema7 = {
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

    outputTemplates: OutputTemplates = {
        imageMessage: {
            example: {
                url: "http://placehold.jp/50x50.png",
                alt: "placeholder image 50x50"
            },
            template: `<div>
    <img style="width: 100%" src="{{url}}" alt="{{alt}}">
</div>`
        }
    };

    componentStartEvent = () => {
        const component = this.getInformation();
        const [, setCtx] = this.useState();

        const feedId = createFeed("imageMessage", {
            url: component.data.url,
            alt: component.data.alt
        });
        setCtx({ messageId: feedId });

        dispatchNextComponentEvent(component.nextComponents);
    }

    componentCleanUp = () => {
        const [ctx,] = this.useState();
        removeFeed(ctx.messageId);
        updateStatus("idle");
        subscribeToEvent(BuiltInEvents.ComponentStart)
        unsubscribeFromEvent(BuiltInEvents.ComponentReset);
        unsubscribeFromEvent(BuiltInEvents.ComponentEnd);
    }

    componentCompleted = () => {

    }

}

registerComponent(new ImageMessage());
