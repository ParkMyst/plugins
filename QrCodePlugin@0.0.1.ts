import {
    BuiltInEvents,
    Component,
    ComponentData,
    dispatchCompleted,
    dispatchNextComponentEvent,
    getComponentInformation,
    isQRCodeEvent,
    JSONSchema7,
    QRCodeEvent,
    registerComponent,
    subscribeToEvent,
    unsubscribeFromEvent
} from "./library/parkmyst-1";


interface QrCodeData extends ComponentData {
    code: string
}

export class QrCode extends Component<QrCodeData> {
    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "code"
        ],
        "properties": {
            "code": {
                "$id": "#/properties/code",
                "type": "string",
                "title": "Code that the user will find",
                "default": "default-code",
            }
        }
    };

    componentOutputTemplate = {};

    constructor() {
        super();
        this.registerSafeEventListeners(BuiltInEvents.QrCode, this.handleQrCode, isQRCodeEvent);
        
    }

    componentStartEvent() {
        subscribeToEvent(BuiltInEvents.QrCode);
    }

    componentCleanUp() {
        unsubscribeFromEvent(BuiltInEvents.QrCode);
    }

    componentCompleted() {
        const component = getComponentInformation<QrCodeData>();
        dispatchNextComponentEvent(component.nextComponents);
    }

    handleQrCode(event: QRCodeEvent) {
        const component = getComponentInformation<QrCodeData>();
        if (component.data.code === event.data.code)
            dispatchCompleted();
    }
}

registerComponent(new QrCode());
