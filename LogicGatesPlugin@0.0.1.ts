import {
    Component,
    ComponentData,
    dispatchNextComponentEvent,
    JSONSchema7,
    registerComponent,
    subscribeToEvent,
    updateStatus
} from "./library/parkmyst-1";

interface ThresholdData extends ComponentData {
    type: "until" | "over" | "equals"
    amount: number
    onTrue: number
    onFalse: number
}

interface ThresholdState {
    activatedAmount: number
}

export class Threshold extends Component<ThresholdData, ThresholdState> {

    description = "Threshold component gives you a way to count activation times. \n" +
        "You can specify the activation type: \n" +
        "- over: Will pass activation forward if it has been activated more than the 'amount' property\n" +
        "- equals: Will pass activation forward only if it has been activated exactly 'amount' times\n" +
        "- until: Will pass activation forward until it has been activated 'amount' times\n" +
        "If this component passes on its activation then onTrue will be fired, otherwise onFalse is fired.";

    useNextComponents: false;

    schema: JSONSchema7 = {
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

    outputTemplates = {};

    gameStartEvent() {
        this.componentCleanUp();
        updateStatus("active");
        subscribeToEvent("componentReset")
    }

    componentCleanUp() {
        const [, setContext] = this.useState();
        setContext({
            activatedAmount: 0
        });
    }

    componentCompleted() {

    }

    componentStartEvent() {
        const component = this.getInformation();
        const [context, setContext] = this.useState();

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
