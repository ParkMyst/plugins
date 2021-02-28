import {
    BuiltInEvents,
    Component,
    ComponentData,
    dispatchCompleted,
    dispatchNextComponentEvent,
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
    description = "QrCode component allows you to specify a string that should be embedded inside a ParkMyst QR code."

    schema: JSONSchema7 = {
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

    outputTemplates = {};

    constructor() {
        super();
        this.registerSafeEventListeners(BuiltInEvents.QrCode, this.handleQrCode, isQRCodeEvent);
    }

    componentStartEvent = () => {
        subscribeToEvent(BuiltInEvents.QrCode);
    }

    componentCleanUp = () => {
        unsubscribeFromEvent(BuiltInEvents.QrCode);
    }

    componentCompleted = () => {
        const component = this.getInformation();
        dispatchNextComponentEvent(component.nextComponents);
    }

    handleQrCode = (event: QRCodeEvent) => {
        const component = this.getInformation();
        if (component.data.code === event.data.code)
            dispatchCompleted();
    }
}

registerComponent(new QrCode());
