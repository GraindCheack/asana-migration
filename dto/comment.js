export class CommentDto {
    constructor(json) {
        this.createdAt = json.created_at;
        this.userId = json.created_by.gid;
        this.userName = json.created_by.name;
        this.html_text = json.html_text || '';
        this.id = json.gid;
        this.text = json.text || '';

        if(this.text.includes('/list') || this.text.includes('/board')) {
            const splitText = json.html_text.split('href="');
            splitText.forEach(item => {
                if(item.startsWith('https://app.asana.com') && (item.includes('/list') || item.includes('/board')) &&  item.includes('>@')) {

                   const user = item.split('>@')[1].split('</a>')[0];
                   const url = item.split('\" data-asana-gid=')[0];

                    this.text = this.text.split(url).join(`${user}`);
                }
            })
        }
    }
}

