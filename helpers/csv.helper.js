import {AsanaRow} from "../dto/asanaRow.js";

export class CsvHelper {
    static csvToModel(pivotArr, data) {
        const json = {};
        pivotArr.forEach((item, index) => json[item] = data[index]);
        return new AsanaRow(json);
    }
    static csvToArray(strData, strDelimiter ){
        strDelimiter = (strDelimiter || ",");

        const objPattern = new RegExp(
            (
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi");

        const arrData = [[]];

        let arrMatches = objPattern.exec(strData);

        while (arrMatches){
            const strMatchedDelimiter = arrMatches[1];

            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ){
                arrData.push([]);
            }

            let strMatchedValue;

            if (arrMatches[2]){

                strMatchedValue = arrMatches[2].replace(
                    new RegExp("\"\"", "g" ),
                    "\"");

            } else {
                strMatchedValue = arrMatches[3];
            }

            arrData[arrData.length - 1].push(strMatchedValue);
            arrMatches = objPattern.exec(strData)
        }
        const asanaRows = arrData.slice(1).map(item => {
          return this.csvToModel(arrData[0], item);
        });

        return asanaRows;
    }
}

