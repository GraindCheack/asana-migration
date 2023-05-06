export class CommonHttpService {
    static async downloadImageAsFile(download_url) {
        try {
            const result = await fetch(download_url);

            if(result.status != 200) {
                throw Error("no img");
            }
            return result;
        } catch (e) {
            const noImg = await fetch('https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg?20200913095930');
            return noImg;
        }

    }
}

