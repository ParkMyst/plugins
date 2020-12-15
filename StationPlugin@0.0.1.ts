import { ComponentData, Component, JSONSchema7, OutputTemplates, useState, ComponentEvent, registerComponent, PlayerPermission, createFeed, dispatchNextComponentEvent, removeFeed, Sender, isPlayerSender, isPlayerController, dispatchCompleted, isPlayerAdmin } from "./library/parkmyst-1";

interface StationData extends ComponentData {
    nextComponent: number,
}

interface StationState {
    waitingFeedId: string,
    controlFeedId: string,
}

interface StationEvent extends ComponentEvent {
    type: "stationCompleted",
    sender: Sender
}

function isStationEvent(event: ComponentEvent): event is StationEvent {
    return event.type === "stationCompleted" &&
        (!isPlayerSender(event.sender) || isPlayerController(event.sender) || isPlayerAdmin(event.sender));
}

export class StationComponent extends Component<StationData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
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
            "nextComponent": { "$ref": "#/definitions/component" }
        }
    };

    gameStartEvent() {
        this.registerSafeEventListeners<StationEvent>("stationCompleted", this.handleStationEvent, isStationEvent);
    }

    componentOutputTemplate: OutputTemplates = {
        stationUserWaiting: {
            display: `
                    <div>
                        A folytatáshoz teljesítsd az állomás feladatát... Ha ez megtörtént kérd az állomás vezetőt hogy engedjen tovább.
                    </div>
                `,
            example: {},
            permission: PlayerPermission.User
        },
        stationController: {
            display: `
                    <form>
                        <label for="stationButton">Complete station</label>  
                        <input id="stationButton" type="submit" inputtype="stationCompleted"/>
                    </form>
                `,
            example: {},
            permission: PlayerPermission.Controller
        }
    };

    componentStartEvent() {
        const [, setState] = useState<StationState>();
        setState({
            waitingFeedId: createFeed("stationUserWaiting",  {}),
            controlFeedId: createFeed("stationController", {}, PlayerPermission.Controller)
        })
    }

    componentCleanUp() {
        const [state] = useState<StationState>();
        removeFeed(state.controlFeedId);
        removeFeed(state.waitingFeedId);
    }

    componentCompleted() {
        const information = this.getComponentInformation();
        dispatchNextComponentEvent(information.data.nextComponent);
    }

    handleStationEvent(event: StationEvent) {
        dispatchCompleted();
    }

}

registerComponent(new StationComponent());
