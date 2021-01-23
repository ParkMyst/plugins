import { Component, JSONSchema7, OutputTemplates, useState, ComponentEvent, registerComponent, PlayerPermission, createFeed, dispatchNextComponentEvent, removeFeed, Sender, isPlayerSender, isPlayerController, dispatchCompleted, isPlayerAdmin, subscribeToEvent, unsubscribeFromEvent } from "./library/parkmyst-1";

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

export class StationComponent extends Component {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "properties": {}
    };

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

    constructor() {
        super();
        this.registerSafeEventListeners<StationEvent>("stationCompleted", this.handleStationEvent, isStationEvent);
    }

    componentStartEvent() {
        const [, setState] = useState<StationState>();
        setState({
            waitingFeedId: createFeed("stationUserWaiting",  {}),
            controlFeedId: createFeed("stationController", {}, PlayerPermission.Controller)
        })
        subscribeToEvent("stationCompleted");
    }

    componentCleanUp() {
        const [state] = useState<StationState>();
        removeFeed(state.controlFeedId);
        removeFeed(state.waitingFeedId);
        unsubscribeFromEvent("stationCompleted");
    }

    componentCompleted() {
        const information = this.getComponentInformation();
        dispatchNextComponentEvent(information.nextComponents);
    }

    handleStationEvent() {
        dispatchCompleted();
    }

}

registerComponent(new StationComponent());
