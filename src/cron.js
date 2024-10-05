require('dotenv').config();
const { default: axios } = require('axios');
const qs = require('qs');
const cron = require('node-cron');

cron.schedule('50 12 * * *', () => {
    console.log('12시 50분 급식푸시 작업이 시작되었습니다.');

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530054&KEY=6b2c5a8bd8284662bf5be43ffb875dc4&MLSV_YMD=${date}`;
    
    axios.get(url)
      .then(async response => {
        let lunch = "";
        if (response.data.RESULT && response.data.RESULT.CODE === "INFO-200") {
          return;
        } else {
          const data = response.data;
          const ddishNm = data.mealServiceDietInfo[1].row[0].DDISH_NM;
          lunch = ddishNm;
        }
    
        const result = lunch
          .split('<br/>')       
          .map(item => item.split('(')[0])
          .map(item => item.trim())      
          .join(', ');                     
    
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        // const sendTargetList = 'admin';
        // const sendTargetTypeList = 'MEMBER'; 

        const sendTargetList = '-1';
        const sendTargetTypeList = 'ALL_TARGET'; 
    
        const data = qs.stringify({
          app_id: "13d2f3b1-84b7-450b-ba8c-c95149fa8784", 
          send_target_list: sendTargetList, 
          send_target_type_list: sendTargetTypeList, 
          send_type: 'push', 
          message_title: `🍙 ${month}월 ${day}일 급식정보`, 
          message_content: result, 
          // message_image_url: '',
          // message_link_url: '',
          app_api_key: process.env.APIKEY 
        });
    
        // 요청 보내기
        axios.post('https://www.swing2app.co.kr/swapi/push_api_send_message', data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .then(response => {
          console.log("푸시 발송 성공", response.data);
        })
        .catch(error => {
          if (error.response) {
            console.error("푸시 발송 실패", {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers
            });
          } else if (error.request) {
            console.error("푸시 발송 실패: 요청 전송 오류", error.request);
          } else {
            console.error("푸시 발송 실패: 설정 오류", error.message);
          }
        });
    
      }).catch(error => {
        console.error("Error fetching the lunch menu:", error);
      });
}, {
    scheduled: true,
    timezone: "Asia/Seoul" 
});


console.log('Cron schedule started - 12am 50');
