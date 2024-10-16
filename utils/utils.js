const fullPattern = /^\d{2}_stu\d{4}@guri\.hs\.kr$/;
const domainPattern = /@guri\.hs\.kr$/;

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatDateForDisplay(date) {
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${month}월 ${day}일`;
}

module.exports = { fullPattern, domainPattern, formatDate, formatDateForDisplay };
