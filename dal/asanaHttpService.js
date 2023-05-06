import {asanaHexConstants} from "../constants/asanaHexConstants.js";
import {commentIdentifier} from "../constants/statusNameConstants.js";
import {CommentDto} from "../dto/comment.js";
import {AsanaCommentsHelper} from "../helpers/asanaCommentsHelper.js";
import {CommonHttpService} from "./commonHttp.sepvice.js";

export class AsanaHttpService {
    constructor() {
        this.client = window.asana.Client.create().useAccessToken(localStorage.getItem('asanaToken'));
    }
     async getAsanaAttachments(attachmentId, taskId) {
        const attachments = await this.client.attachments.getAttachment(attachmentId, {parent: taskId, opt_pretty: true});
        return attachments;
    }

     async getAsanaCustomFieldsStatuses(projectId) {
        const project = await this.client.projects.getProject(projectId, {opt_pretty: true});
        let customFieldSettingsStatuses = project['custom_field_settings'].find(item => item['custom_field'].name.toLowerCase().includes('status -') ||  item['custom_field'].name.toLowerCase() ==='status');

        if(!customFieldSettingsStatuses) {
            customFieldSettingsStatuses = project['custom_field_settings'].find(item => item['custom_field'].name.toLowerCase().includes('nat status'));
        }

        const mappedStatuses = customFieldSettingsStatuses?.custom_field?.enum_options.map((item, index) => {
            return {
                color: asanaHexConstants[item.color],
                name: item.name,
                resolved: AsanaCommentsHelper.setStatusResolved(item.name),
            }
        });

        const customFieldSettingsTags = project['custom_field_settings'].find(item => item['custom_field'].name.toLowerCase().includes('task'))?.custom_field?.enum_options;
        const customSettings = project['custom_field_settings'].filter(item => !item['custom_field'].name.toLowerCase().includes('task') &&  !item['custom_field'].name.toLowerCase().includes('status -') && item['custom_field'].name.toLowerCase() !=='status');
        const mappedCustomSettings = customSettings.map(item => item['custom_field'] );
        return [mappedStatuses, customFieldSettingsTags, mappedCustomSettings];
    }

     async getAllWorkspaceProjects() {
        let offset;
        let result;
        const projects = await this.client.projects.getProjectsForWorkspace(localStorage.getItem('asanaWorkSpace'), {opt_pretty: true, limit: 100});
         offset = projects._response?.next_page?.offset;
         result = [...projects.data];
         while(offset) {
             const projectsWithOffset = await this.client.projects.getProjectsForWorkspace(localStorage.getItem('asanaWorkSpace'), {opt_pretty: true, limit: 100, offset});
             offset = projectsWithOffset._response?.next_page?.offset;
             result = [...result, ...projectsWithOffset.data];
         }
         return result;
    }

    async getAllWorkspaceUsers() {
        const projects = await this.client.users.getUsersForWorkspace(localStorage.getItem('asanaWorkSpace'), {opt_pretty: true});
        return projects.data;
    }

     async getAsanaTaskComments(taskId) {
        const taskStories = await this.client.stories.getStoriesForTask(taskId, { opt_fields : 'html_text,type,text,created_at,created_by', opt_pretty: true, "type": "comment", limit: 100});

        const comments = taskStories.data.filter(story => story.type === commentIdentifier).map(comment => new CommentDto(comment));

        const attachmentsObjsIds = await this.getAsanaAttachmentsForObject(taskId);
        const attachmentsPromises = [];
        attachmentsObjsIds.forEach(id => attachmentsPromises.push(this.getAsanaAttachments(id, taskId)));

        const attachements = await Promise.all(attachmentsPromises);
        comments.forEach(comment => {
                AsanaCommentsHelper.getImageInDefaultAttachmentDuration(comment, attachements);
        });
        const preparedComments = [];

        comments.forEach(item => preparedComments.push(AsanaCommentsHelper.splitCommentByImgUrls(item)));
        const flatComments = preparedComments.flat();


         flatComments.forEach(item => {
             if(item.text.startsWith('asset_id')) {
                 const currentAttachements = attachements.find(attachment => attachment.permanent_url.includes(item.text.split('\n')[0]));

                 if(currentAttachements) {
                     item.text = currentAttachements.download_url;
                 }
             }
         });

        return flatComments ;
    }

     async getAsanaAttachmentsForObject(taskId) {
        const attachmentsObjs = await this.client.attachments.getAttachmentsForObject({parent: taskId, opt_fields : 'html_text',});
        return attachmentsObjs.data.map(attachmentsObj => attachmentsObj.gid);
    }
}