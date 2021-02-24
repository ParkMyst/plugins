import {
    Component,
    ComponentData,
    ComponentEvent,
    createFeed,
    dispatchCompleted,
    dispatchNextComponentEvent,
    isPlayerSender,
    JSONSchema7,
    OutputTemplates,
    PlayerPermission,
    registerComponent,
    removeFeed,
    subscribeToEvent,
    unsubscribeFromEvent,
    updateFeed,
    useState
} from "./library/parkmyst-1";

interface QuestionData extends ComponentData {
    question: string
    answer: string,
    matchPercentage: number
    onFail: number
}

interface Comment {
    username: string,
    profilePictureUrl: string,
    answer: string,
}

interface AnswerEvent extends ComponentEvent {
    type: "simpleAnswer",
    data: {
        answer: string,
    }
}

function isAnswerEvent(event: ComponentEvent): event is AnswerEvent {
    return event.type === "simpleAnswer"
        && typeof event.data.answer === "string";
}

function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    let tmp, i, j, prev, val, row;
    if (a.length > b.length) {
        tmp = a;
        a = b;
        b = tmp
    }

    row = Array(a.length + 1);
    for (i = 0; i <= a.length; i++) {
        row[i] = i
    }

    for (i = 1; i <= b.length; i++) {
        prev = i;
        for (j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                val = row[j - 1] // match
            } else {
                val = Math.min(row[j - 1] + 1, // substitution
                    Math.min(prev + 1,     // insertion
                        row[j] + 1))  // deletion
            }
            row[j - 1] = prev;
            prev = val
        }
        row[a.length] = prev
    }
    return row[a.length]
}

interface SimpleQuestionState {
    feedId: string
}

export class SimpleQuestion extends Component<QuestionData, SimpleQuestionState> {
    description = "SimpleQuestion component allows you ask a question from the player. \n" +
        "The simple version has no built-in response to the user's answer, therefore custom handling is advised.\n" +
        "You can specify the question and answer with the corresponding properties.\n" +
        "When the question is answered the next components will be fired, otherwise the onFail component is called.\n" +
        "You can specify the percentage of match required. This uses the levenshtein algorithm.";

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "type": "object",
        "additionalProperties": false,
        "required": [
            "question",
            "answer",
            "matchPercentage",
            "onFail"
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
            "question": {
                "$id": "#/properties/question",
                "type": "string",
                "title": "Question",
                "default": "Default question!"
            },
            "answer": {
                "$id": "#/properties/answer",
                "type": "string",
                "title": "Answer",
                "default": "Default answer"
            },
            "matchPercentage": {
                "$id": "#/properties/matchPercentage",
                "type": "integer",
                "title": "Percentage of match required",
                "default": 1.0,
                "minimum": 0.0,
                "maximum": 1.0
            },
            "onFail": {
                "$ref": "#/definitions/component",
                "title": "Component on fail",
            }
        }
    };

    outputTemplates: OutputTemplates = {
        simpleQuestion: {
            example: {
                question: "This is a question?"
            },
            template:
                `<form>
    <p>
        {{question}}
    </p>
    <input type="text" name="answer">
    <input type="submit" inputtype="simpleAnswer"/>
</form>`
        }
    };

    constructor() {
        super();
        this.registerSafeEventListeners("simpleAnswer", this.handleSimpleAnswer, isAnswerEvent);
    }

    componentStartEvent() {
        subscribeToEvent("simpleAnswer");
        const component = this.getInformation();
        const [, setContext] = this.useState();

        const ctx: SimpleQuestionState = {
            feedId: createFeed("simpleQuestion", {
                question: component.data.question
            })
        };

        setContext(ctx);
    }

    componentCleanUp() {
        const [ctx,] = this.useState();
        unsubscribeFromEvent("simpleAnswer");
        removeFeed(ctx.feedId);
    }

    componentCompleted() {
        const data = this.getInformation();
        dispatchNextComponentEvent(data.nextComponents);
    }

    handleSimpleAnswer = (event: AnswerEvent) => {
        const answer = event.data.answer;
        const component = this.getInformation();
        const matchPercentage = (component.data.answer.length - levenshtein(component.data.answer, answer)) / component.data.answer.length;
        if (matchPercentage >= component.data.matchPercentage) {
            dispatchCompleted();
        } else {
            dispatchNextComponentEvent(component.data.onFail);
        }
    }

}

registerComponent(new SimpleQuestion());

interface CommentQuestionState {
    feedId: string,
    comments: Comment[],
}

export class CommentQuestion extends Component<QuestionData, CommentQuestionState> {
    description = "ComponentQuestion component allows you ask a question from the player. \n" +
        "This version will record the users' answers and send them with the feed.\n" +
        "You can specify the question and answer with the corresponding properties.\n" +
        "When the question is answered the next components will be fired, otherwise the onFail component is called.\n" +
        "You can specify the percentage of match required. This uses the levenshtein algorithm.";

    schema: JSONSchema7 = {
        "$schema": "http://json-schema.org/draft-07/schema",
        "$id": "http://example.com/example.json",
        "type": "object",
        "required": [
            "question",
            "answer",
            "matchPercentage",
            "onFail",
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
            "question": {
                "$id": "#/properties/question",
                "type": "string",
                "title": "Question",
                "default": "Default question!"
            },
            "answer": {
                "$id": "#/properties/answer",
                "type": "string",
                "title": "Answer",
                "default": "Default answer"
            },
            "matchPercentage": {
                "$id": "#/properties/matchPercentage",
                "type": "integer",
                "title": "Percentage of match required",
                "default": 1,
                "minimum": 0,
                "maximum": 1
            },
            "onFail": {
                "$ref": "#/definitions/component",
                "title": "Component on fail"
            }
        }
    };

    outputTemplates: OutputTemplates = {
        commentQuestion: {
            example: {
                question: "Test question",
                comments: [
                    {
                        username: "user1",
                        profilePictureUrl: "http://placehold.jp/50x50.png",
                        answer: "Not the right one",
                    }
                ]
            },
            template:
                `<form>
    <p>
        {{question}}
    </p>
    <input type="text" name="answer">
    <input type="submit" inputtype="simpleAnswer"/>
</form>
<ul>
    {% for comment in comments %}
    <li>
        <p>
        <img src="{{comment.profilePictureUrl}}" width="50px" height="50px" alt="{{comment.username}} profile picture">
            {{comment.username}}: {{comment.answer}}            
        </p>
    </li>
    {% endfor %}
</ul>`
        }
    };

    constructor() {
        super();        
        this.registerSafeEventListeners("simpleAnswer", this.handleAnswer, isAnswerEvent);
    }

    componentStartEvent() {
        subscribeToEvent("simpleAnswer")
        const component = this.getInformation();
        const [, setContext] = this.useState();

        const ctx: CommentQuestionState = {
            feedId: createFeed("commentQuestion", {
                question: component.data.question,
                comments: []
            }),
            comments: []
        };

        setContext(ctx);
    }

    componentCleanUp() {
        unsubscribeFromEvent("simpleAnswer");
        const [ctx,] = this.useState();
        removeFeed(ctx.feedId);
    }

    componentCompleted() {
        const data = this.getInformation();
        dispatchNextComponentEvent(data.nextComponents);
    }

    handleAnswer = (event: AnswerEvent) => {
        const component = this.getInformation();
        const [ctx, setContext] = this.useState();
        const answer = event.data.answer;
        const matchPercentage = (component.data.answer.length - levenshtein(component.data.answer, answer)) / component.data.answer.length;
        if (matchPercentage >= component.data.matchPercentage) {
            dispatchCompleted();
        } else {
            if (isPlayerSender(event.sender)) {
                ctx.comments.push(
                    {
                        username: event.sender.username,
                        profilePictureUrl: event.sender.profilePictureUrl,
                        answer: answer,
                    }
                );
                setContext(ctx);
                updateFeed(ctx.feedId, {
                    question: component.data.question,
                    comments: ctx.comments
                })
            }
            dispatchNextComponentEvent(component.data.onFail);
        }
    }
}

registerComponent(new CommentQuestion());
