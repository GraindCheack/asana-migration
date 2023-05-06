import {Project} from "../dto/project.js";

export class CommonMapper {
    static mapProjects(projects) {
        return projects.data.map(item => new Project(item))
    }
}