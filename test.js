const axios = require('axios');

// 2. 포트를 이용한 시간표 데이터 요청
async function getTimetable() {
  try {
    const url = `http://comci.net/:4082/`;
    const response = await axios.get(url);
    console.log(response)
    return response.data;
  } catch (error) {
    console.error('Error getting timetable:', error);
  }
}

// 3. 시간표 데이터를 분석하여 필요한 정보를 추출합니다.
function parseTimetable(data) {
  const teacherNames = ['김', '이', '박'];
  const subjects = ['국어', '수학'];

  const timetable = {
    past: [],
    present: []
  };

  data.forEach(entry => {
    const isTeacher = teacherNames.some(name => entry.teacher.includes(name));
    const isSubject = subjects.some(subject => entry.subject.includes(subject));
    
    if (isTeacher && isSubject) {
      if (entry.type === 'past') {
        timetable.past.push(entry);
      } else if (entry.type === 'present') {
        timetable.present.push(entry);
      }
    }
  });

  return timetable;
}

async function main() {
  try {
      const timetableData = await getTimetable();
      if (timetableData) {
        const parsedTimetable = parseTimetable(timetableData);
        console.log('Parsed Timetable:', parsedTimetable);
      }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
