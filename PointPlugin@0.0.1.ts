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

interface GlobalPointState {
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
    description = "PointInitializer component will give you an always active component that counts points. \n" +
        "If you want a point system from this plugin this MUST be present.";

    schema: JSONSchema7 = {
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

    useNextComponents: false;

    outputTemplates = {};

    constructor() {
        super();
        this.registerSafeEventListeners("pointEvent", this.handlePointEvent, isPointEvent);
    }

    componentStartEvent(): void {
        const component = this.getInformation();
        const [context, setContext] = useSharedState<GlobalPointState>();
        if (context.points === undefined)
            context.points = {};
        context.points[component.data.id] = {
            point: 0
        };
        setContext(context);
        subscribeToEvent("pointEvent");
    }

    componentCleanUp() {
        unsubscribeFromEvent("pointEvent");
    }

    componentCompleted() {
    }

    handlePointEvent(event: PointEvent) {
        const component = this.getInformation();
        if (event.data.counterId === component.data.id || event.data.counterId.length === 0) {
            const [context, setContext] = useSharedState<GlobalPointState>();
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
    operation: "add" | "remove",
    amount: number
}

export class PointChanger extends Component<PointChangerData> {
    description = "PointChanger component will give a mean to change the points in the point system.\n" +
        "The following basic arithmetic operations are permitted: \n" +
        "- add: Will add 'amount' of points\n" +
        "- remove: Will deduct 'amount' of points\n" +
        "You can specify the point system with the 'counterId' property";

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "counterId",
            "operation",
            "amount"
        ],
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
            }
        }
    };

    outputTemplates = {};

    componentStartEvent(): void {
        const component = this.getInformation();
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
        const component = this.getInformation();
        dispatchNextComponentEvent(component.nextComponents);
    }

    componentCleanUp() {

    }

}

registerComponent(new PointChanger());

interface PointResultData extends ComponentData {
    counterId: string
}

interface PointResultState {
    messageId: string
}

export class PointResult extends Component<PointResultData, PointResultState> {

    description = "PointResult component allows you to show the current situation of points inside a point system.\n" +
        "Will signal the next components and stays active.";

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "counterId"
        ],
        "properties": {
            "counterId": {
                "$id": "#/properties/counterId",
                "type": "string",
                "title": "Id for point system",
                "default": "1"
            }
        }
    };

    outputTemplates: OutputTemplates = {
        pointResult: {
            example: {
                points: 5
            },
            template: `<div>
    <p>You scored: {{points}}</p>
</div>`
        }
    };

    useNextComponents = false;
    doCleanUpOnCompletion = false;
    defaultCleanUpEnabled = false;

    componentStartEvent(): void {
        const component = this.getInformation()
        const [context,] = useSharedState<GlobalPointState>();
        const points = context.points[component.data.counterId]?.point ?? -1;
        const [, setCtx] = this.useState();

        const feedId = createFeed("pointResult", { points }, PlayerPermission.User);
        setCtx({ messageId: feedId });

        dispatchCompleted();
    }

    componentCleanUp() {
        const [ctx,] = this.useState();
        removeFeed(ctx.messageId);
        updateStatus("idle");
        subscribeToEvent(BuiltInEvents.ComponentStart)
        unsubscribeFromEvent(BuiltInEvents.ComponentReset);
        unsubscribeFromEvent(BuiltInEvents.ComponentEnd);
    }

    componentCompleted() {
        const component = this.getInformation();
        dispatchNextComponentEvent(component.nextComponents);
    }

}

registerComponent(new PointResult());
