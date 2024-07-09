const { default: axios } = require('axios');
const cron = require('node-cron');

cron.schedule('0 10 * * *', () => {
    console.log('10시 작업이 시작되었습니다.');
    axios.get(url)
    .then(async response => {
      let lunch = "";
      if (response.data.RESULT && response.data.RESULT.CODE === "INFO-200") {
        lunch = "오늘의 급식정보가 존재하지 않습니다.";
      } else {
        const data = response.data;
        const ddishNm = data.mealServiceDietInfo[1].row[0].DDISH_NM;
        lunch = ddishNm;
      }
      console.log(lunch)
    }).catch(error => {
      console.error("Error fetching the lunch menu:", error);
    });
}, {
    scheduled: true,
    timezone: "Asia/Seoul" 
});

console.log('Cron schedule started - 10am');
