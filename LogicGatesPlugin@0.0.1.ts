import {
    Component,
    ComponentData,
    dispatchNextComponentEvent,
    getComponentInformation,
    JSONSchema7,
    registerComponent, subscribeToEvent, updateStatus,
    useState
} from "./library/parkmyst-1";

interface ThresholdData extends ComponentData {
    type: "until" | "over" | "equals"
    amount: number
    onTrue: number
    onFalse: number
}

interface ThresholdContext {
    activatedAmount: number
}

export class Threshold extends Component<ThresholdData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "type",
            "amount",
            "onTrue",
            "onFalse"
        ], "definitions": {
            "component": {
                "$id": "#/definitions/component",
                "type": "number",
                "title": "Next component",
                "default": -1,
                "minimum": -1,
                "format": "parkmyst-id"
            },
        },
        "properties": {
            "type": {
                "$id": "#/properties/type",
                "type": "string",
                "title": "Type of the threshold",
                "default": "equals",
                "enum": ["over", "until", "equals"]
            },
            "amount": {
                "$id": "#/properties/amount",
                "type": "integer",
                "title": "Amount required to activate",
                "default": 5.0,
                "minimum": 0.0,
                "multipleOf": 1.0
            },
            "onTrue": {
                "$ref": "#/definitions/component",
                "title": "Next component on threshold met"
            },
            "onFalse": {
                "$ref": "#/definitions/component",
                "title": "Next component on threshold NOT met"
            }
        }
    };

    defaultCleanUpEnabled = false;
    doCleanUpOnCompletion = false;
    defaultComponentStartEnabled = false;

    componentOutputTemplate = {};

    gameStartEvent() {
        this.componentCleanUp();
        updateStatus("active");
        subscribeToEvent("componentReset")
    }

    componentCleanUp() {
        const [, setContext] = useState<ThresholdContext>();
        setContext({
            activatedAmount: 0
        });
    }

    componentCompleted() {

    }

    componentStartEvent() {
        const component = getComponentInformation<ThresholdData>();
        const [context, setContext] = useState<ThresholdContext>();

        context.activatedAmount++;
        setContext(context);

        let satisfied = false;
        switch (component.data.type) {
            case "equals":
                satisfied = component.data.amount === context.activatedAmount;
                break;
            case "over":
                satisfied = component.data.amount < context.activatedAmount;
                break;
            case "until":
                satisfied = component.data.amount > context.activatedAmount;
                break;
        }
        dispatchNextComponentEvent(satisfied ? component.data.onTrue : component.data.onFalse);
    }

}

registerComponent(new Threshold());
