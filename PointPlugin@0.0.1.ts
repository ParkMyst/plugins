import {
    BuiltInEvents,
    Component,
    ComponentData,
    ComponentEvent,
    createFeed,
    dispatchCompleted,
    dispatchComponentEvent,
    dispatchNextComponentEvent,
    getComponentInformation,
    isPlayerSender,
    isPlayerUser,
    JSONSchema7,
    OutputTemplates,
    PlayerPermission,
    PlayerSender,
    registerComponent,
    removeFeed,
    subscribeToEvent,
    unsubscribeFromEvent,
    updateStatus,
    useSharedState,
    useState
} from "./library/parkmyst-1";


interface PointEvent extends ComponentEvent {
    type: "pointEvent",
    sender: PlayerSender,
    data: {
        counterId: string
        operation: "add" | "remove",
        amount: number
    }
}

function isPointEvent(event: ComponentEvent): event is PointEvent {
    return event.type === "pointEvent"
        && typeof event.data.counterId === "string"
        && typeof event.data.amount === "number"
        && typeof event.data.operation === "string"
        && (event.data.operation === "add" || event.data.operation === "remove")
        && (!isPlayerSender(event.sender) || !isPlayerUser(event.sender))
}

interface PointGlobalContext {
    points: {
        [key: string]: {
            point: number
        }
    }
}

interface PointInitializerData extends ComponentData {
    id: string
}

export class PointInitializer extends Component<PointInitializerData> {
    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "id"
        ],
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
        "properties": {
            "id": {
                "$id": "#/properties/id",
                "type": "string",
                "title": "Id for point system",
                "default": "1",
            }
        }
    };

    autoStart = true;

    componentOutputTemplate = {};

    componentStartEvent(): void {
        const component = getComponentInformation<PointInitializerData>();
        const [context, setContext] = useSharedState<PointGlobalContext>();
        if (context.points === undefined)
            context.points = {};
        context.points[component.data.id] = {
            point: 0
        };
        setContext(context);
        this.registerSafeEventListeners("pointEvent", this.handlePointEvent, isPointEvent);
    }

    componentCleanUp() {
        this.unregisterEventListeners("pointEvent");
    }

    componentCompleted() {
    }

    handlePointEvent(event: PointEvent) {
        const component = getComponentInformation<PointInitializerData>();
        if (event.data.counterId === component.data.id || event.data.counterId.length === 0) {
            const [context, setContext] = useSharedState<PointGlobalContext>();
            switch (event.data.operation) {
                case "add":
                    context.points[component.data.id].point += event.data.amount;
                    break;
                case "remove":
                    context.points[component.data.id].point -= event.data.amount;
                    break;
            }
            setContext(context);
        }
    }

}

registerComponent(new PointInitializer());

interface PointChangerData extends ComponentData {
    counterId: string,
    operation: "add" | "remove"
    amount: number,
    nextComponent: number
}

export class PointChanger extends Component<PointChangerData> {
    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "counterId",
            "operation",
            "amount",
            "nextComponent"
        ],
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
        "properties": {
            "counterId": {
                "$id": "#/properties/counterId",
                "type": "string",
                "title": "Id for point system",
                "default": "1"
            },
            "operation": {
                "$id": "#/properties/operation",
                "type": "string",
                "title": "Type of the operation",
                "default": "add",
                "enum": ["add", "remove"]
            },
            "amount": {
                "$id": "#/properties/amount",
                "type": "integer",
                "title": "Amount of points to change",
                "default": 1.0,
                "minimum": 0.0,
                "multipleOf": 1.0
            },
            "nextComponent": { "$ref": "#/definitions/component" }
        }
    };

    componentOutputTemplate = {};

    componentStartEvent(): void {
        const component = getComponentInformation<PointChangerData>();
        dispatchComponentEvent({
            type: "pointEvent",
            data: {
                counterId: component.data.counterId,
                amount: component.data.amount,
                operation: component.data.operation,
            }
        });
        dispatchCompleted();
    }

    componentCompleted() {
        const component = getComponentInformation<PointChangerData>();
        dispatchNextComponentEvent(component.data.nextComponent);
    }

    componentCleanUp() {

    }

}

registerComponent(new PointChanger());

interface PointResultData extends ComponentData {
    counterId: string,
    nextComponent: number
}

interface FeedContext {
    messageId: string
}

export class PointResult extends Component<PointResultData> {
    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "counterId",
            "nextComponent"
        ],
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
        "properties": {
            "counterId": {
                "$id": "#/properties/counterId",
                "type": "string",
                "title": "Id for point system",
                "default": "1"
            },
            "nextComponent": { "$ref": "#/definitions/component" }
        }
    };

    componentOutputTemplate: OutputTemplates = {
        pointResult: {
            example: {
                points: 5
            },
            display: `<div>
    <p>You scored: {{points}}</p>
</div>`,
            permission: PlayerPermission.User
        }
    };

    doCleanUpOnCompletion = false;
    defaultCleanUpEnabled = false;

    componentStartEvent(): void {
        const component = getComponentInformation<PointResultData>();
        const [context,] = useSharedState<PointGlobalContext>();
        const points = context.points[component.data.counterId]?.point ?? -1;
        const [, setCtx] = useState<FeedContext>();

        const feedId = createFeed("pointResult", { points }, PlayerPermission.User);
        setCtx({ messageId: feedId });

        dispatchCompleted();
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
        const component = getComponentInformation<PointResultData>();
        dispatchNextComponentEvent(component.data.nextComponent);
    }

}

registerComponent(new PointResult());
