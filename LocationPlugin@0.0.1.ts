import {
    BuiltInEvents,
    Component,
    ComponentData,
    createFeed,
    dispatchCompleted,
    dispatchNextComponentEvent,
    getComponentInformation,
    isLocationUpdatedEvent,
    JSONSchema7,
    LocationUpdatedEvent,
    OutputTemplates,
    PlayerPermission,
    registerComponent,
    removeFeed,
    updateFeed,
    useState
} from "./library/parkmyst-1";

interface LocationData extends ComponentData {
    coordinates: {
        latitude: number,
        longitude: number
    }
    sensitivity: number,
    nextComponent: number
}

interface LocationContext {
    feedId: string,
    players: string[]
    playerLocations: {
        [key: string]: PlayerLocationClue
        [key: number]: PlayerLocationClue
    }
}

interface PlayerLocationClue {
    longitude: number,
    latitude: number,
    url: string
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    } else {
        const radlat1 = Math.PI * lat1 / 180;
        const radlat2 = Math.PI * lat2 / 180;
        const theta = lon1 - lon2;
        const radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515 * 1.609344;
        return dist;
    }
}

export class Location extends Component<LocationData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "coordinates",
            "sensitivity",
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
            },
            "location": {
                "$id": "#/definitions/location",
                "type": "object",
                "title": "Coordinates of point (latitude, longitude)",
                "properties": {
                    "latitude": {
                        "type": "number",
                        "title": "Latitude",
                        "default": 47.4984,
                        "minimum": -90,
                        "maximum": 90
                    },
                    "longitude": {
                        "type": "number",
                        "title": "Longitude",
                        "default": 19.0404,
                        "minimum": -180,
                        "maximum": 180
                    }
                },
            }
        },
        "properties": {
            "coordinates": { "$ref": "#/definitions/location" },
            "sensitivity": {
                "$id": "#/properties/sensitivity",
                "type": "number",
                "title": "Proximity to location (km)",
                "default": 0.1,
                "minimum": 0.0
            },
            "nextComponent": { "$ref": "#/definitions/component" }
        }
    };

    componentOutputTemplate: OutputTemplates = {
        locationHint: {
            example: {
                longitude: 47.541246,
                latitude: 19.243312,
                players: ["test"],
                playerLocations: {
                    "test": {
                        longitude: 47.541497,
                        latitude: 19.240538,
                        url: "https://placehold.jp/50x50.png"
                    }
                }
            },
            display: `<div style="height: 500px">
					<map latitude="{{latitude}}" longitude="{{longitude}}">
						<marker latitude="{{latitude}}" 
								longitude="{{longitude}}"
								icon="images/airplane.svg" iconX="50" iconY="50">
							<popup>Coordinates: {{latitude}}, {{longitude}}</popup>
						</marker>
						{% for username in players %}
						<marker latitude="{{playerLocations[username].latitude}}" 
								longitude="{{playerLocations[username].longitude}}"
								icon="{{playerLocations[username].url}}" iconX="25" iconY="25">
							<popup>{{username}}</popup>
						</marker>
						{% endfor %}
					</map>
				</div>`,
            permission: PlayerPermission.User
        }
    };

    componentStartEvent() {
        const component = getComponentInformation<LocationData>();
        const [, setContext] = useState<LocationContext>();

        this.registerSafeEventListeners(BuiltInEvents.LocationUpdated, this.handleLocationUpdated, isLocationUpdatedEvent);
        const context: LocationContext = {
            feedId: createFeed("locationHint", {
                latitude: component.data.coordinates.latitude,
                longitude: component.data.coordinates.longitude,
            }),
            players: [],
            playerLocations: {}
        };
        setContext(context);
    }

    handleLocationUpdated(event: LocationUpdatedEvent) {
        const component = getComponentInformation<LocationData>();
        const [ctx, setContext] = useState<LocationContext>();

        const username: string = event.sender.username;
        const playerLongitude: number = event.sender.longitude;
        const playerLatitude: number = event.sender.latitude;
        const sensitivity = component.data.sensitivity;
        const targetLatitude = component.data.coordinates.latitude;
        const targetLongitude = component.data.coordinates.longitude;

        const notInList = ctx.players.findIndex((player: string) => player === username) === -1;
        if (notInList) {
            ctx.players.push(username);
        }

        ctx.playerLocations[username] = {
            longitude: playerLongitude,
            latitude: playerLatitude,
            url: event.sender.profilePictureUrl
        };

        updateFeed(ctx.feedId, {
            latitude: component.data.coordinates.latitude,
            longitude: component.data.coordinates.longitude,
            players: ctx.players,
            playerLocations: ctx.playerLocations,
        });

        setContext(ctx);

        if (distance(playerLatitude, playerLongitude, targetLatitude, targetLongitude) <= sensitivity)
            dispatchCompleted();
    }

    componentCleanUp() {
        this.unregisterEventListeners(BuiltInEvents.LocationUpdated);
        const [ctx,] = useState<LocationContext>();
        removeFeed(ctx.feedId);
    }

    componentCompleted() {
        const component = getComponentInformation<LocationData>();
        dispatchNextComponentEvent(component.data.nextComponent)
    }

}

registerComponent(new Location());
