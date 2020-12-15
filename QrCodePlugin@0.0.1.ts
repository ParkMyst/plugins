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
    registerComponent
} from "./library/parkmyst-1";


interface QrCodeData extends ComponentData {
    code: string
    nextComponent: number
}

export class QrCode extends Component<QrCodeData> {
    schemaComponentData: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "code"
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
            "code": {
                "$id": "#/properties/code",
                "type": "string",
                "title": "Code that the user will find",
                "default": "default-code",
            },
            "nextComponent": { "$ref": "#/definitions/component" }
        }
    };

    componentOutputTemplate = {};

    componentStartEvent() {
        this.registerSafeEventListeners(BuiltInEvents.QrCode, this.handleQrCode, isQRCodeEvent);
    }

    componentCleanUp() {

    }

    componentCompleted() {
        const component = getComponentInformation<QrCodeData>();
        dispatchNextComponentEvent(component.data.nextComponent);
    }

    handleQrCode(event: QRCodeEvent) {
        const component = getComponentInformation<QrCodeData>();
        if (component.data.code === event.data.code)
            dispatchCompleted();
    }
}

registerComponent(new QrCode());
