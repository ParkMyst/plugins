import {
    BuiltInEvents,
    Component,
    ComponentData,
    createFeed,
    dispatchCompleted,
    dispatchNextComponentEvent,
    isLocationUpdatedEvent,
    JSONSchema7,
    LocationUpdatedEvent,
    OutputTemplates,
    registerComponent,
    removeFeed,
    subscribeToEvent,
    unsubscribeFromEvent,
    updateFeed
} from "./library/parkmyst-1";

interface LocationData extends ComponentData {
    coordinates: {
        latitude: number,
        longitude: number
    },
    sensitivity: number,
    showMarker: boolean,
    markerPictureUrl: string;
    markerPopupText: string;
    showUsers: boolean,
    containerClass: string,
}

interface LocationState {
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

export class LeafletLocation extends Component<LocationData, LocationState> {

    description = "LeafletLocation component provides you with a simple 'go there!' action for the player. " +
        "You can specify the location with latitude and longitude, and you can also specify the sensitivity that is given is units of meter." +
        "This component uses an external leaflet dependency, and therefore is experimental. This will succeed the Location Component";

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "coordinates",
            "sensitivity",
            "showMarker",
            "markerPictureUrl",
            "showUsers"
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
            },
            "showMarker": {
                "$id": "#/properties/showMarker",
                "type": "boolean",
                "title": "Show marker",
                "default": true
            },
            "markerPictureUrl": {
                "$id": "#/properties/markerPictureUrl",
                "type": "string",
                "title": "Marker picture url",
                "default": "http://assets.stickpng.com/images/58568b014f6ae202fedf2717.png"
            },
            "markerPopupText": {
                "$id": "#/properties/markerPopupText",
                "type": "string",
                "title": "Marker popup text",
                "default": "This is your goal!"
            },
            "showUsers": {
                "$id": "#/properties/showUsers",
                "type": "boolean",
                "title": "Show users",
                "default": true
            },
            "containerClass": {
                "$id": "#/properties/containerClass",
                "type": "string",
                "title": "Map container class name",
                "default": "leaflet-map-container"
            }
        }
    };

    outputTemplates: OutputTemplates = {
        leafletHint: {
            example: {
                longitude: 47.541246,
                latitude: 19.243312,
                showMarker: true,
                markerPictureUrl: "http://assets.stickpng.com/images/58568b014f6ae202fedf2717.png",
                showUsers: true,
                markerPopupText: "Your goal is here!",
                players: ["test"],
                containerClass: "leaflet-map-container",
                playerLocations: {
                    "test": {
                        longitude: 47.541497,
                        latitude: 19.240538,
                        url: "https://placehold.jp/50x50.png"
                    }
                }
            },
            template: `<div id="leaflet-plugin-container-{{id}}" class="{{containerClass}}" style="width: 90%; margin: 0 auto; height: 50vh">
    
</div>
<script>
var leafletPluginMapId = "{{id}}";

if (leafletPluginMarkers === undefined) {
    var leafletPluginMarkers = {};
}

if (leafletPluginMaps === undefined) {
    var leafletPluginMaps = {};
}

var map = createMapSetup(leafletPluginMapId)("leaflet-plugin-map-" + leafletPluginMapId);
leafletPluginMaps[leafletPluginMapId] = map;

function createMapSetup(mapId) {
    return function mapSetup(mapName) {
        var container = L.DomUtil.get(mapName);

        var map;
        if (container != null && leafletPluginMaps[mapId] != null && leafletPluginMaps != undefined) {
            map = leafletPluginMaps[mapId];
        } else {
            document.getElementById('leaflet-plugin-container-' + mapId).innerHTML = "<div id=" + mapName + "></div>";
            map = L.map(mapName);

            var mapLatitude = parseFloat("{{latitude}}");
            var mapLongitude = parseFloat("{{longitude}}");

            map.setView([mapLatitude, mapLongitude], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors'
            }).addTo(map);

            if ("{{showMarker}}" === "true") {
                var mainIcon = L.icon({
                    iconUrl: "{{markerPictureUrl}}",
                    iconSize: [50, 50],
                });
                var mainMarker = L.marker([mapLatitude, mapLongitude], { icon: mainIcon }).addTo(map);
                var popupText = "{{markerPopupText}}";
                if (popupText.length !== 0)
                    mainMarker.bindPopup(popupText)
            }

        }

        if (leafletPluginMarkers[mapId] !== undefined) {
            leafletPluginMarkers[mapId].forEach(marker => map.removeLayer(marker));
            leafletPluginMarkers[mapId] = [];
        }

        if ("{{showUsers}}" === "true") {
            updateMarkers(mapId, map);
        }
        return map;
    }
}

function updateMarkers(mapId, map) {
    if (leafletPluginMarkers[mapId] === undefined)
        leafletPluginMarkers[mapId] = [];

    var marker;
    var icon;
    var latitude;
    var longitude;
    {% for username in players %}
    icon = L.icon({
        iconUrl: "{{playerLocations[username].url}}",
        iconSize: [25, 25]
    });
    latitude = parseFloat("{{playerLocations[username].latitude}}");
    longitude = parseFloat("{{playerLocations[username].longitude}}");
    marker = L.marker([latitude, longitude], {
        icon: icon
    }).addTo(map);
    marker.bindPopup("{{username}}");
    leafletPluginMarkers[mapId].push(marker);
    {% endfor %}
}
</script>`
        }
    };

    constructor() {
        super();
        this.registerSafeEventListeners(BuiltInEvents.LocationUpdated, this.handleLocationUpdated, isLocationUpdatedEvent);
    }

    componentStartEvent  = () => {
        const information = this.getInformation();
        const [, setContext] = this.useState();

        subscribeToEvent(BuiltInEvents.LocationUpdated)
        const context: LocationState = {
            feedId: createFeed("leafletHint", {
                latitude: information.data.coordinates.latitude,
                longitude: information.data.coordinates.longitude,
                showMarker: information.data.showMarker,
                markerPictureUrl: information.data.markerPictureUrl,
                markerPopupText: information.data.markerPopupText,
                showUsers: information.data.showUsers,
                containerClass: information.data.containerClass,
                id: information.id,
            }),
            players: [],
            playerLocations: {}
        };
        setContext(context);
    }

    handleLocationUpdated = (event: LocationUpdatedEvent) => {
        const information = this.getInformation();
        const [ctx, setContext] =  this.useState();

        const username: string = event.sender.username;
        const playerLongitude: number = event.sender.longitude;
        const playerLatitude: number = event.sender.latitude;
        const sensitivity = information.data.sensitivity;
        const targetLatitude = information.data.coordinates.latitude;
        const targetLongitude = information.data.coordinates.longitude;

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
            latitude: information.data.coordinates.latitude,
            longitude: information.data.coordinates.longitude,
            showMarker: information.data.showMarker,
            markerPictureUrl: information.data.markerPictureUrl,
            markerPopupText: information.data.markerPopupText,
            showUsers: information.data.showUsers,
            containerClass: information.data.containerClass,
            players: ctx.players,
            playerLocations: ctx.playerLocations,
            id: information.id
        });

        setContext(ctx);

        if (distance(playerLatitude, playerLongitude, targetLatitude, targetLongitude) <= sensitivity)
            dispatchCompleted();
    }

    componentCleanUp = () => {
        unsubscribeFromEvent(BuiltInEvents.LocationUpdated)
        const [ctx,] = this.useState();
        removeFeed(ctx.feedId);
    }

    componentCompleted = () => {
        const information = this.getInformation();
        dispatchNextComponentEvent(information.nextComponents)
    }

}

registerComponent(new LeafletLocation());
