export class Project {
    constructor(json) {
        this.id = json['id'];
        this.name = json['name'];
        this.key = json['key']['key'];
    }
}