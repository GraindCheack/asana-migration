export class AsanaCommentsHelper {
    static defaultAttachmentDuration = 30000;

    static getImageInDefaultAttachmentDuration(comment, attachments) {
        const commentCreatedAt = new Date(comment.createdAt).getTime();
        attachments.forEach(attachment => {
            const attachmentCreatedAt = new Date(attachment.created_at).getTime();
            const diff = (commentCreatedAt - attachmentCreatedAt);

            if (diff > 0 && diff < this.defaultAttachmentDuration) {
                if (!comment.text.includes(attachment.permanent_url)) {
                    comment.text += `\n` + attachment.permanent_url;
                }
            }
        })
    }

    static splitCommentByImgUrls(comment) {
        const result = [];

        if (comment.text.includes('https://app.asana.com/app/asana/-/get_asset?')) {
            const splitText = comment.text.split('https://app.asana.com/app/asana/-/get_asset?');
            splitText.forEach(item => {
                const newComment = {...comment, text: item};
                if (newComment.text.trim() && newComment.text !== '\n') {
                    if (newComment.text.startsWith('asset_id')) {
                        let resultString = '';
                        for (let i = 0; i < newComment.text.length; i++) {
                            if (newComment.text[i] === ' ' || newComment.text[i] === '\n') {
                                break;
                            }
                            resultString += newComment.text[i];
                        }

                        const resultComment = {...comment, text: resultString};
                        result.push(resultComment);

                        const restText = newComment.text.split(resultString)[1];

                        if (restText.trim() && restText !== '\n') {
                            const restComment = {...comment, text: newComment.text.split(resultString)[1]};

                            result.push(restComment);
                        }

                    } else {
                        result.push(newComment);
                    }
                }

            })
        } else {
            result.push(comment);
        }

        return result;
    }

    static setStatusResolved(name) {
        switch (name) {
            case 'Done':
                return true;
            case 'Ready to ship':
                return true;
            case 'Closed':
                return true;
            case 'Deployed to DEV-QA':
                return false;
            case 'BUG Fixing':
                return false;
            case 'On Hold':
                return false;
            case 'Testing':
                return false;
            case 'Deployed to OPS':
                return false;
            case 'Ready to ship to UAT':
                return false;
            case 'In progress':
                return false;
            case 'Deployed to develop':
                return false;
            case 'Deployed to UAT':
                return false;
            case 'Deployed to Prod':
                return false;
            default :
                return true;
        }
    }
}