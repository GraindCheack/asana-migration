import {CsvHelper} from "../helpers/csv.helper.js";

export class CommonService {
    constructor(baseUrl) {
        this.tokenBase = 'Bearer ';
        this.baseUrl = baseUrl;
        this.fullToken = null;
        this.issuesList = null;
        this.jetSpaceProjects = null;
        this.asanaProjects = null;
        this.selectedJetBrainsProject = null;
        this.selectedJetBrainsProjectName = null;
        this.selectedAsanaProject = null;
        this.jetBrainsUrl = null;
        this.jetStatuses = null;
        this.asanaStatuses = null;
        this.tags = null;
        this.createdIssuesIdsByName = {};
    }

    set token(tokenString) {
        this.fullToken = this.tokenBase + tokenString;
    }

    get url() {
        return this.jetBrainsUrl;
    }

    set url(url) {
        return this.jetBrainsUrl = url;
    }

   readFile(file) {
        let reader = new FileReader();
        reader.readAsText(file);

        return new Promise((resolve) => {
            reader.onload = function() {
                resolve(CsvHelper.csvToArray(reader.result));
            };

            reader.onerror = function() {
                console.log(reader.error);
            };
        })
    }

    isFormValid() {
        return !!this.selectedJetBrainsProject && !!this.selectedAsanaProject && !!this.issuesList?.length;
    }
}