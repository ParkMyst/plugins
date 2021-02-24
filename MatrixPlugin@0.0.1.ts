import * as Parkmyst from "./library/parkmyst-1";


export class MatrixTheme extends Parkmyst.Theme {
    protected name: string = "Matrix theme";
    protected description: string = "This is a test theme for a matrix themed game!";

    protected outputTemplates: Parkmyst.OutputTemplates = {
        message: {
            template: `<div style="background: grey; border-radius: 10px; padding: 10px; margin: 10px 0;">
    {{message}}
</div>`,
            example: {
                message: "hello from the matrix!"
            }
        },
        imageMessage: {
            template: `<div>
    <img style="max-width: 400px; width: 100%" src="{{url}}" alt="{{alt}}">
</div>`,
            example: {
                url: "https://via.placeholder.com/150",
                alt: "image"
            }
        },
        commentQuestion: {
            template: `<div style="background: grey; border-radius: 10px; padding: 10px">
	<form>
		<p>
			{{question}}
		</p>
		<input type="text" name="answer">
		<input type="submit" inputtype="simpleAnswer"/>
</form>
		<div style="display: flex; flex-direction: column;">
			{% for comment in comments %}
			<p>
				<img src="{{comment.profilePictureUrl}}" width="50px" height="50px" alt="{{comment.username}} profile picture">
            {{comment.username}}: {{comment.answer}}
        </p>
				{% endfor %}
		</div>
</div>`,
            example: {
                question: "Test question",
                comments: [
                    {
                        username: "user1",
                        profilePictureUrl: "http://placehold.jp/50x50.png",
                        answer: "Not the right one",
                    }
                ]
            }
        }
    };

    protected htmlHeader: string = `<header>
    My game header
</header>`;

    protected htmlFooter: string = `<header>
    My game footer
</header>`;

    protected style: string = `body {
    background: url(https://cdn.pixabay.com/photo/2020/07/02/04/31/matrix-5361690_960_720.png);
    color: white;
}`;
}

Parkmyst.registerTheme(new MatrixTheme());
