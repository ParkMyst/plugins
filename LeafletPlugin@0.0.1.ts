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
    subscribeToEvent,
    unsubscribeFromEvent,
    updateFeed,
    useState
} from "./library/parkmyst-1";

interface LocationData extends ComponentData {
    coordinates: {
        latitude: number,
        longitude: number
    }
    sensitivity: number
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

export class LeafletLocation extends Component<LocationData> {

    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "coordinates",
            "sensitivity"
        ],
        "definitions": {
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
            }
        }
    };

    componentOutputTemplate: OutputTemplates = {
        leafletHint: {
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
            display: `<div style="width: 90%; margin: 0 auto; height: 50vh">
    <div id="leaflet-map-{{id}}"></div>
</div>
<script>
    if (maps === undefined) {
	    var maps = {}    	
    }
    
    if (maps["leaflet-map-{{id}}"] === undefined) {
	    maps["leaflet-map-{{id}}"] = {
	    	markers: [],
	    	map: mapSetup{{id}}("leaflet-map-{{id}}"),
        };
    }

    updateMarkers{{id}}();

    function updateMarkers{{id}}() {
    	var map = maps["leaflet-map-{{id}}"].map;
    	var markers = maps["leaflet-map-{{id}}"].markers;
    	markers.forEach(marker => map.removeLayer(marker));
	    maps["leaflet-map-{{id}}"].markers = [];
    	
	    var marker;
	    var icon;
	    {% for username in players %}
	    icon = L.icon({
		    iconUrl: "{{playerLocations[username].url}}",
		    iconSize: [25, 25]
	    });
	    marker = L.marker([{{playerLocations[username].latitude}}, {{playerLocations[username].longitude}}], {
		    icon: icon
	    }).addTo(map);
	    marker.bindPopup("{{username}}");
	    maps["leaflet-map-{{id}}"].markers.push(marker);
	    {% endfor %}
    }
    
    function mapSetup{{id}}(mapName) {
	    var map = L.map('leaflet-map-{{id}}');
	    var mapLatitude = parseInt("{{latitude}}");
	    var mapLongitude = parseInt("{{longitude}}");

	    map.setView([mapLatitude, mapLongitude], 14);
	    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		    attribution: '&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors'
	    }).addTo(map);

	    var mainIcon = L.icon({
		    iconUrl: "https://tcbmag.com/wp-content/uploads/2020/03/7fe12969-5641-4ce0-9395-e325cee0e830.jpg",
		    iconSize: [50, 50],
	    });
	    var mainMarker = L.marker([mapLatitude, mapLongitude], {icon: mainIcon}).addTo(map);
	    mainMarker.bindPopup("célpont: {{latitude}}, {{longitude}}")
	    return map;
    }
</script>`,
            permission: PlayerPermission.User
        }
    };

    constructor() {
        super();
        this.registerSafeEventListeners(BuiltInEvents.LocationUpdated, this.handleLocationUpdated, isLocationUpdatedEvent);
    }

    componentStartEvent() {
        const component = getComponentInformation<LocationData>();
        const [, setContext] = useState<LocationContext>();

        subscribeToEvent(BuiltInEvents.LocationUpdated)
        const context: LocationContext = {
            feedId: createFeed("leafletHint", {
                latitude: component.data.coordinates.latitude,
                longitude: component.data.coordinates.longitude,
                id: component.id,
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
            id: component.id
        });

        setContext(ctx);

        if (distance(playerLatitude, playerLongitude, targetLatitude, targetLongitude) <= sensitivity)
            dispatchCompleted();
    }

    componentCleanUp() {
        unsubscribeFromEvent(BuiltInEvents.LocationUpdated)
        const [ctx,] = useState<LocationContext>();
        removeFeed(ctx.feedId);
    }

    componentCompleted() {
        const component = getComponentInformation<LocationData>();
        dispatchNextComponentEvent(component.nextComponents)
    }

}

registerComponent(new LeafletLocation());
