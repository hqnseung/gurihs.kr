const { default: axios } = require('axios');
const cron = require('node-cron');

function exampleFunction() {
    axios.get(url)
        .then(async response => {
            if (response.data.RESULT && response.data.RESULT.CODE === "INFO-200") {
                return
            } else {
                const data = response.data;
                const ddishNm = data.mealServiceDietInfo[1].row[0].DDISH_NM;
                console.log(ddishNm)
            }
        }).catch(error => {
            console.error("Error fetching the lunch menu:", error);
        });
}

cron.schedule('0 10 * * *', () => {
    console.log('10시 작업이 시작되었습니다.');
    exampleFunction();
}, {
    scheduled: true,
    timezone: "Asia/Seoul" 
});

console.log('Cron 작업이 설정되었습니다.');
