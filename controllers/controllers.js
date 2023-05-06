import {CommonService} from "../services/common.service.js";
import {defaultStatusName} from "../constants/statusNameConstants.js";
import {AsanaHttpService} from "../dal/asanaHttpService.js";
import {JetSpaceHttpService} from "../dal/jetSpaceHttpService.js";
import {CommonHttpService} from "../dal/commonHttp.sepvice.js";

export async function initControllers() {
    const commonService = new CommonService();
    const asanaHttpService = new AsanaHttpService();
    const fileLoader = document.getElementById('file-loader');
    const fileLoaderText = document.getElementById('file-loader-text');
    const selectJetBrainsOptionsContainer = document.getElementById('jet-brains-options');
    const selectAsanaOptionsContainer = document.getElementById('asana-project-options');
    const spinner = document.getElementById('spinner');
    const submitButton = document.getElementById('submit-button');
    const migrateResult = document.getElementById('migrate-result');
    const migrateResultClose = document.getElementById('migrate-result-close');
    const migrateResultList = document.getElementById('migrate-result-list');
    const filter = document.getElementById('asana-projects-filter');

    filter.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    filter.addEventListener('input', (event) => {
        event.stopPropagation();
        document.querySelectorAll(".asana-custom-option").forEach(item => {
            if(!event.target.value.trim()) {
                item.classList.remove('hidden');
                return;
            }

            if(item.getAttribute('data-name').toLowerCase().startsWith(event.target.value.toLowerCase())) {
                item.classList.remove('hidden');
            }
            else {
                item.classList.add('hidden');
            }
        })
    });

    toggleLoading();
    commonService.jetSpaceProjects = await JetSpaceHttpService.getProjects();
    commonService.asanaProjects = await asanaHttpService.getAllWorkspaceProjects();

    commonService.asanaProjects = commonService.asanaProjects.sort(function(a, b){
        if(a.name.toLowerCase().trim() < b.name.toLowerCase().trim()) { return -1; }
        if(a.name.toLowerCase().trim() > b.name.toLowerCase().trim()) { return 1; }
        return 0;});

    commonService.jetSpaceProjects = commonService.jetSpaceProjects.sort(function(a, b){
        if(a.name.toLowerCase().trim() < b.name.toLowerCase().trim()) { return -1; }
        if(a.name.toLowerCase().trim() > b.name.toLowerCase().trim()) { return 1; }
        return 0;});

    toggleLoading();

    commonService.jetSpaceProjects.forEach(project => {
        const option = createSelectOption(project.name, project.id, 'jet-custom-option');
        selectJetBrainsOptionsContainer.append(option);
    });

    commonService.asanaProjects.forEach(project => {
        const option = createSelectOption(project.name, project.gid, 'asana-custom-option');
        selectAsanaOptionsContainer.append(option);
    });

    for (const option of document.querySelectorAll(".jet-custom-option")) {
        addOptionListener(option, (context) => {
            commonService.selectedJetBrainsProject = context.getAttribute('data-value');
        });
    }

    for (const option of document.querySelectorAll(".asana-custom-option")) {
        addOptionListener(option, (context) => {
            commonService.selectedAsanaProject = context.getAttribute('data-value')
            commonService.selectedJetBrainsProjectName = context.getAttribute('data-name');
        });
    }


    window.addEventListener('click', function (e) {
        const jetSelect = document.getElementById('jet-projects-select');
        const asanaSelect = document.getElementById('asana-projects-select');

        if(filter.contains(e.target)) {
            return;
        }


        if (!jetSelect.contains(e.target) && !asanaSelect.contains(e.target)) {
            jetSelect.classList.remove('open');
            asanaSelect.classList.remove('open');
        }

        if (jetSelect.contains(e.target)) {
            asanaSelect.classList.remove('open');
        }

        if (asanaSelect.contains(e.target)) {
            jetSelect.classList.remove('open');
        }
    });

    document.getElementById('jet-brains-projects').addEventListener('click', function () {
        this.querySelector('.select').classList.toggle('open');
        submitButton.disabled = !commonService.isFormValid();

        if(submitButton.disabled) {
            submitButton.classList.add('disabled');
        }
        else {
            submitButton.classList.remove('disabled');
        }
    });

    document.getElementById('asana-projects').addEventListener('click', function () {
        this.querySelector('.select').classList.toggle('open');
        submitButton.disabled = !commonService.isFormValid();

        if(submitButton.disabled) {
            submitButton.classList.add('disabled');
        }
        else {
            submitButton.classList.remove('disabled');
        }
    });


    fileLoader.addEventListener('change', async (input) => {
        if(!input.target.files.length) {
            return;
        }

        fileLoaderText.innerText = input.target.files[0].name;
        commonService.issuesList = await commonService.readFile(input.target.files[0]);
        commonService.issuesList = commonService.issuesList.filter(item => item.taskId);

        submitButton.disabled = !commonService.isFormValid();

        if(submitButton.disabled) {
            submitButton.classList.add('disabled');
        }
        else {
            submitButton.classList.remove('disabled');
        }
    });

    migrateResultClose.addEventListener('click', () => {
        toggleResultModal();
    });

    addSubmitButtonEventListener();

    function toggleLoading() {
        spinner.classList.toggle('hidden');
    }

    function createResultItem(itemData, title) {
        const item = document.createElement('div');
        item.className = 'result-list-item';

        const itemTitle = document.createElement('div');
        itemTitle.className = 'result-list-item-title';
        const itemTitleText = document.createElement('div');
        itemTitleText.innerText = title;
        itemTitle.append(itemTitleText);
        const itemTitlePin = document.createElement('div');
        itemTitlePin.className = 'result-list-item-status';

        itemTitlePin.classList.add(itemData.status);

        itemTitle.append(itemTitlePin);

        item.append(itemTitle);

        const itemText = document.createElement('div');
        itemText.className = 'result-list-item-text';
        itemText.innerText = itemData.value?.statusText || itemData.value?.statusText;

        item.append(itemText);

        migrateResultList.append(item);
    }

    function toggleResultModal() {
        migrateResult.classList.toggle('hidden');
    }

    function createSelectOption(name, id, identifier) {
        const option = document.createElement('span');
        option.classList.add('custom-option');
        option.classList.add(identifier);
        option.innerText = name;
        option.setAttribute('data-value', id);
        option.setAttribute('data-name', name);

        return option;
    }

    function addOptionListener(option, callback) {
        option.addEventListener('click', function () {
            if (!this.classList.contains('selected')) {
                const selectedOption = this.parentNode.querySelector('.custom-option.selected');

                if (selectedOption) {
                    selectedOption.classList.remove('selected');
                }

                this.classList.add('selected');
                this.closest('.select').querySelector('.select__trigger span').textContent = this.textContent;
                callback(this);
            }
        })
    }

    function addSubmitButtonEventListener() {

        submitButton.addEventListener('click', async () => {
            toggleLoading();
            const customFields = await JetSpaceHttpService.getCustomFields(commonService.selectedJetBrainsProject);

            const allBoards = await JetSpaceHttpService.getAllProjectBoards(commonService.selectedJetBrainsProject);
            let board = allBoards.data.find(item => item.name === commonService.selectedJetBrainsProjectName);

            if(!board) {
                board = await  JetSpaceHttpService.createBoard(commonService.selectedJetBrainsProjectName, commonService.selectedJetBrainsProject);
            }

            const projectMembers = await JetSpaceHttpService.getProjectMembers(commonService.selectedJetBrainsProject);
            const combinedData = await asanaHttpService.getAsanaCustomFieldsStatuses(commonService.selectedAsanaProject);
            const jetTags = await JetSpaceHttpService.getAllHierarchicalTags(commonService.selectedJetBrainsProject);

            commonService.asanaStatuses = combinedData[0];
            commonService.tags = combinedData[1];

            const customStatusesPromises = [];

            for (let i = 0; i < combinedData[2].length; i++) {
                const name = combinedData[2][i].name;
                const value = combinedData[2][i]['enum_options'] ?? combinedData[2][i].name;
                const isCustomFieldExist = customFields.find(customField =>customField.name === name.trim());

                if(!isCustomFieldExist) {
                    customStatusesPromises.push(JetSpaceHttpService.createCustomField(name.trim(), value, commonService.selectedJetBrainsProject))
                }
            }

            const jetStatuses = await Promise.allSettled(customStatusesPromises);
            const mappedJetStatuses = [...customFields, jetStatuses.map(item => item.value)];

            const statuses = await JetSpaceHttpService.getJetStatuses(commonService.selectedJetBrainsProject)
            commonService.jetStatuses = statuses;

            if(!statuses.length || statuses.length === 3) {
                await JetSpaceHttpService.createJetStatuses(commonService.asanaStatuses, commonService.selectedJetBrainsProject);
                commonService.jetStatuses = await JetSpaceHttpService.getJetStatuses(commonService.selectedJetBrainsProject);
            }

            const tagsPromises = [];

            if (commonService.tags?.length) {
                commonService.tags.forEach(tag => tagsPromises.push(JetSpaceHttpService.createJetTags(tag, commonService.selectedJetBrainsProject)));

                if (commonService.tags) {
                    await Promise.all(tagsPromises);
                }
            }


            migrateResultList.innerHTML = '';

            let start = 0;
            let end = commonService.issuesList.length < 100 ? commonService.issuesList.length : start + 100;

            while (start < commonService.issuesList.length) {
                await createIssuesBatch(commonService.issuesList.slice(start, end));

                start = end;
                end = start + 100 < commonService.issuesList.length ? start + 100 : commonService.issuesList.length;

                console.log(`Обработано ${start} из ${commonService.issuesList.length}`);
            }

            toggleLoading();
            toggleResultModal();

            async function createIssuesBatch(issues) {
                const promises = [];

                issues.forEach(issue => {
                    let status = commonService.jetStatuses.find(status => status.name === issue.status);

                    if(!status) {
                        status = commonService.jetStatuses.find(status => status.name ===  defaultStatusName)
                    }
                    issue.status = status.id;
                });

                issues.forEach((item) => {
                    promises.push(JetSpaceHttpService.createIssue(item, mappedJetStatuses, jetTags.data, projectMembers, commonService.selectedJetBrainsProject, asanaHttpService));
                });
                const result = await Promise.allSettled(promises);

                result.forEach((item, index) => {
                    createResultItem(item, issues[index].name);
                });


                for (let i = 0; i < result.length; i++) {
                    const comments = await asanaHttpService.getAsanaTaskComments(issues[i].taskId);
                    const downloadImagePromises = [];

                    comments.forEach(comment => {
                        if (comment.text.startsWith('https://asana-user-private-us-east-1.s3.amazonaws.com/assets')) {
                            downloadImagePromises.push(CommonHttpService.downloadImageAsFile(comment.text))
                        }
                    });

                    const downloadImagePromisesResults = await Promise.allSettled(downloadImagePromises);
                    let uploadCounter = 0;

                    const json = await result[i]?.value?.json();

                    if(json) {
                        await JetSpaceHttpService.addTaskToBoard(board.id, json.id);
                    }


                    if (comments.length) {


                        if(!json) {
                           console.log(`${issues[i].name} не было перенесено, добавьте мануально`);
                        }

                        if(json){
                            for (let j = 0; j < comments.length; j++) {

                                if (comments[j].text.startsWith('https://asana-user-private-us-east-1.s3.amazonaws.com/assets')) {
                                    const resultToBlob = await downloadImagePromisesResults[uploadCounter].value.blob();
                                    const file = new File([resultToBlob], "asanaMigration");
                                    const imageId = await JetSpaceHttpService.uploadAttachment(file );
                                    await JetSpaceHttpService.attachImageToJetComment(json.id, imageId);
                                    uploadCounter++;

                                } else {
                                    await JetSpaceHttpService.addJetIssueComment(json.id, comments[j]);
                                }
                            }
                        }
                    }
                }

            }
        });
    }

}