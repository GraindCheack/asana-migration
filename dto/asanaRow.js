import {defaultStatusName} from "../constants/statusNameConstants.js";

export class AsanaRow {
    constructor(json) {
        this.taskId = json['Task ID'];
        this.createdAt = json['Created At'];
        this.completedAt = json['Completed At'];
        this.lastModified = json['Last Modified'];
        this.name = json['Name'];
        this.sectionColumn = json['Section/Column'];
        this.assignee = json['Assignee'];
        this.assigneeEmail = json['Assignee Email'];
        this.startDate = json['Start Date'];
        this.dueDate = json['Due Date'];
        this.tags = json['Tags'];
        this.notesAttachements = [];
        this.notes = json['Notes'];

        if (this.notes && json['Notes'].includes('https://app.asana.com/app/asana/-/get_asset?asset_id=')) {
            const pivot = 'https://app.asana.com/app/asana/-/get_asset';
            const splitData = json['Notes'].split(pivot);
            splitData.forEach(item => {
                let result = '';
                if (item.startsWith('?asset_id=')) {
                    for (let i = 0; i < item.length; i++) {
                        if (item[i] === '\n') {
                            this.notesAttachements.push(result);
                            break;
                        }
                        result += item[i];
                    }
                }
            });

            this.notesAttachements.forEach(attachement => {
                this.notes = this.notes.split('https://app.asana.com/app/asana/-/get_asset' + attachement).join('');
            })
        }

        this.projects = json['Projects'];
        this.projectTask = json['Parent Task'];
        this.blockedBy = json['Blocked By (Dependencies)'];
        this.blocking = json['Blocking (Dependencies)'];
        this.businessArea = json['Business Area'];
        this.biDashboard = json['BI Dashboard'];
        this.taskOrEpic = json['Task or Epic'];

        if (json['Status -']) {
            this.status = json['Status -'];
        } else if (json['Nat Status']) {
            this.status = json['Nat Status'];
        } else if (json['Status']) {
            this.status = json['Status'];
        }
        else {
            this.status = defaultStatusName;
        }

        this.priority = json['Priority'];
        this.qaStatus = json['QA Status'];
        this.type = json['Type'];
        this.releaseDate = json['Release Date'];
        this.section = json['[EST_INT] Section'];
        this.checkBiDashBoard = json['Check BI dashboard'];
        this.epicStatus = json['Epic status'];
        this.uiDevStatus = json['UI dev Status'];
        this.estDays = json['EST, days'];
        this.creator = json['Creator'];
        this.execution = json['Execution'];
        this.note = json['Note'];

        const keys = Object.keys(json);
        keys.forEach(key => this[key] = json[key]?.trim());
    }
}
