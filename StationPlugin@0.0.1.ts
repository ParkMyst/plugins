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

export class StationComponent extends Component<unknown, StationState> {
    description = "StationComponent gives you a control point, where a controller player has to manually signal that a team has completed the task."

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "properties": {}
    };

    outputTemplates: OutputTemplates = {
        stationUserWaiting: {
            template: `
                    <div>
                        A folytatáshoz teljesítsd az állomás feladatát... Ha ez megtörtént kérd az állomás vezetőt hogy engedjen tovább.
                    </div>
                `,
            example: {}
        },
        stationController: {
            template: `
                    <form>
                        <label for="stationButton">Nyomd meg ezt a gombot, ha a csapat teljesítette a feladatát!</label>  
                        <input id="stationButton" type="submit" inputtype="stationCompleted"/>
                    </form>
                `,
            example: {}
        }
    };

    constructor() {
        super();
        this.registerSafeEventListeners<StationEvent>("stationCompleted", this.handleStationEvent, isStationEvent);
    }

    componentStartEvent() {
        const [, setState] = this.useState();
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
        const information = this.getInformation();
        dispatchNextComponentEvent(information.nextComponents);
    }

    handleStationEvent() {
        dispatchCompleted();
    }

}

registerComponent(new StationComponent());
