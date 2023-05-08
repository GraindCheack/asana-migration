import {asanaHexConstants} from "../constants/asanaHexConstants.js";
import {defaultStatusName} from "../constants/statusNameConstants.js";
import {CommonMapper} from "../mappers/common.mapper.js";
import {AsanaCommentsHelper} from "../helpers/asanaCommentsHelper.js";
import {CommonHttpService} from "./commonHttp.sepvice.js";

export class JetSpaceHttpService {
    static async createIssue(item, jetCustomStatuses, jetTags, projectMembers, project, asanaService, parentTaskId) {
     const attachmentsObjsIds = await asanaService.getAsanaAttachmentsForObject(item.taskId);
        const attachmentsPromises = [];
        attachmentsObjsIds.forEach(id => attachmentsPromises.push(asanaService.getAsanaAttachments(id, item.taskId)));

        const attachments = await Promise.all(attachmentsPromises);
        const downloadLinksForNotes = item.notesAttachements.map(permanentLink => {
            const mappedAttachment = attachments.find(attachment => attachment.permanent_url.includes(permanentLink));
            return mappedAttachment.download_url;
        })

        const downloadImagePromises = [];
        downloadLinksForNotes.forEach(link =>  downloadImagePromises.push(CommonHttpService.downloadImageAsFile(link)));
        const downloadImagePromisesResults = await Promise.allSettled(downloadImagePromises);

        const notesImages = [];

        for(let i = 0; i < downloadImagePromisesResults.length; i++) {
            const resultToBlob = await downloadImagePromisesResults[i].value.blob();
            const file = new File([resultToBlob], "asanaMigration");
            const id = await JetSpaceHttpService.uploadAttachment(file );
            notesImages.push( {
                "className": "ImageAttachment",
                id,
                "width": 400,
                "height": 400
            });
        }

        const tag = jetTags.find(tag => tag.name === item.taskOrEpic);
        const projectMember = projectMembers.find(member => member.username === item.assigneeEmail.split('@')[0]);
        const customFields = [];

        jetCustomStatuses.forEach(status => {
            if(!item[status.name]?.trim()) {
                return;
            }
            if(status.type === 'ENUM') {

                customFields.push(
                    {
                        "fieldId": status.id,
                        "value": {
                            "className": "EnumCFInputValue",
                            "enumValueIdentifier": "name:" + item[status.name.trim()],
                        }
                    },
                );
            }

            if(status.type === 'STRING') {
                customFields.push(
                    {
                        "fieldId": status.id,
                        "value": {
                            "className": "StringCFValue",
                            "value": item[status.name.trim()],
                        }
                    },
                );
            }
        });

        const body = {
            "title": item.name || "EMPTY",
            "description": `${item.notes}${item['Parent Task'] ? `\n\nParent task: ${item['Parent Task']}` : ''}`,
            "dueDate": item.dueDate || null,

            "status": item.status,
        }

        if(projectMember) {
            body["assignee"] = "username:" + item.assigneeEmail.split('@')[0];
        }

        if(notesImages.length) {
            body['attachments'] = notesImages;
        }

        if(customFields.length) {
          body.customFields = customFields;
        }

        if(parentTaskId) {
            body.parents = [`id:${parentTaskId}`];
        }

        if(tag) {
            body.tags = [tag.id];
        }

        return await window.fetch(localStorage.getItem('jetBrainsUrl')+ `/api/http/projects/id:${project}/planning/issues`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });
    }

    static async createJetStatuses(statuses, project) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ `/api/http/projects/id:${project}/planning/issues/statuses`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                statuses:  [{
                    color: asanaHexConstants.white,
                    name: defaultStatusName,
                    resolved: false,
                }, ...statuses]
            })
        });

        return result;
    }

    static async getAllHierarchicalTags(project) {
        const result = await window.fetch(`https://datamola.jetbrains.space/api/http/projects/id:${project}/planning/tags`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        return await result.json();
    }

    static async addJetIssueComment(taskId, comment) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/chats/messages/send-message', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "channel": `issue:id:${taskId}`,
                "content": {
                    "className": "ChatMessage.Text",
                    "text": comment.text
                }
            })
        });

        return result;
    }

    static async attachImageToJetComment(issue, img) {
        const url = localStorage.getItem('jetBrainsUrl')  + '/api/http/chats/messages/send-message';
        const result = await window.fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "channel": `issue:id:${issue}`,
                "content": {
                    "className": "ChatMessage.Block",
                    "sections": []
                },
                "attachments": [
                    {
                        "className": "ImageAttachment",
                        "id": img,
                        "width": 1000,
                        "height": 1000
                    }
                ]
            })
        });

        return result;
    }

    static async createJetTags(tag, project) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ `/api/http/projects/id:${project}/planning/tags`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: [tag.name],
            })
        });

        return result;
    }

    static async getProjectMembers(projectId) {
        const result = await window.fetch(`https://datamola.jetbrains.space/api/http/projects/id:${projectId}/access/member-profiles?includingAdmins=true`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        const json = await result.json();
        return json.data;
    }

    static async uploadAttachment(file) {

        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/uploads', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "storagePrefix": "attachment",
                "mediaType": "chat-image-attachment"
            })
        });
        const path = await result.json();

        const fullPath = localStorage.getItem('jetBrainsUrl') + path + '/' + "asanaMigration";

        let formData = new FormData();
        formData.append("fileName", file);
        formData.append("mediaType", "chat-image-attachment");

        const uploadResult = await window.fetch(fullPath,
            {
                body: formData,
                method: "PUT"
            });

        return await uploadResult.text();
    }

    static async getProjects() {
        const response = await window.fetch(localStorage.getItem('jetBrainsUrl')+ '/api/http/projects', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        const responseData = await response.json();
        return CommonMapper.mapProjects(responseData);
    }

    static async getJetStatuses(project) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl')+ `/api/http/projects/id:${project}/planning/issues/statuses`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        return await result.json();
    }

    static async createCustomField(name, value, project) {
        const body = {
            name,
            "type": Array.isArray(value) ? "ENUM" : "STRING",
        }

        if(Array.isArray(value)) {
            body.parameters =    {
                "className": "EnumCFInputParameters",
                    "values": value.map(item => item.name.trim())
            }
        }

        const result = await window.fetch(localStorage.getItem('jetBrainsUrl') + `/api/http/custom-fields-v2/issueTracker:project:id:${project}/fields`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return await result.json();
    }

    static async createBoard(name, project) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl') + `/api/http/projects/id:${project}/planning/boards`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               name
            })
        });

        return await result.json();
    };

    static async getAllProjectBoards(project) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl') + `/api/http/projects/id:${project}/planning/boards`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
        });

        return await result.json();
    };

    static async addTaskToBoard(board, task) {
        const result = await window.fetch(`https://datamola.jetbrains.space/api/http/projects/planning/boards/id:${board}/issues/id:${task}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json'
            },
            body: JSON.stringify(null)
        });

        return await result.text();
    };

    static async getCustomFields(project) {
        const result = await window.fetch(localStorage.getItem('jetBrainsUrl') + `/api/http/custom-fields-v2/issueTracker:project:id:${project}/fields`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jetToken'),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });

        return await result.json();
    };

}