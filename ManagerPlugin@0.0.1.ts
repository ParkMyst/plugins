import {
    BuiltInEvents,
    Component,
    ComponentData,
    ComponentEndEvent,
    ComponentResetEvent,
    dispatchCompleted,
    dispatchComponentEvent,
    dispatchNextComponentEvent,
    getComponentInformation,
    JSONSchema7,
    registerComponent,
    GameEndEvent
} from "./library/parkmyst-1";

interface FinisherData extends ComponentData {
    toFinish: number
}

export class Finisher extends Component<FinisherData> {

    description = "The Finisher component will send a componentEnd lifecycle event (finishes the component) to the component on its 'toFinish' port."

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "toFinish"
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
            "toFinish": {
                "$ref": "#/definitions/component",
                "title": "Component to finish"
            },
        }
    };


    outputTemplates = {};

    componentStartEvent = () => {
        dispatchComponentEvent<ComponentEndEvent>({
            type: BuiltInEvents.ComponentEnd,
            data: {
                target: getComponentInformation<FinisherData>().data.toFinish
            }
        });
        dispatchCompleted();
    }

    componentCleanUp = () => {

    }

    componentCompleted = () => {
        const component = this.getInformation();
        dispatchNextComponentEvent(component.nextComponents)
    }
}

registerComponent(new Finisher());

interface ReseterData extends ComponentData {
    toReset: number
}

export class Reseter extends Component<ReseterData> {

    description = "The Rester component will send a componentReset lifecycle event (reverts to original state) to the component on its 'toFinish' port."

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "toReset"
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
            "toReset": {
                "$ref": "#/definitions/component",
                "title": "Component to reset"
            }
        }
    };


    outputTemplates = {};

    componentStartEvent = () => {
        dispatchComponentEvent<ComponentResetEvent>({
            type: BuiltInEvents.ComponentReset,
            data: {
                target: getComponentInformation<ReseterData>().data.toReset
            }
        });
        dispatchCompleted();
    }

    componentCleanUp = () => {

    }

    componentCompleted = () => {
        const component = this.getInformation();
        dispatchNextComponentEvent(component.nextComponents)
    }
}

registerComponent(new Reseter());

export class StartNode extends Component {
    description = "The StartNode component will activate itself on the game's start, and finish itself shortly.";

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "properties": {}
    };
    autoStart = true;

    outputTemplates = {};

    componentCompleted = () => {
        const component = this.getInformation();
        dispatchNextComponentEvent(component.nextComponents)
    }

    componentCleanUp = () => {

    }

    componentStartEvent = () => {
        dispatchCompleted();
    }
}

registerComponent(new StartNode());

export class EndNode extends Component {
    description = "The EndNode will signal that the game has ended to the game.";
    useNextComponents = false;

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false
    };

    outputTemplates = {};

    protected componentCleanUp = (): void => {

    }

    protected componentCompleted = (): void => {
        dispatchComponentEvent<GameEndEvent>({
            type: BuiltInEvents.GameEnd,
            data: {}
        })
    }


    protected componentStartEvent = (): void => {
        dispatchCompleted();
    }
}
registerComponent(new EndNode());
