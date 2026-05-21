const { studentWelcomeTemplate, staffWelcomeTemplate } = require('../src/utils/emailTemplates');

const student = studentWelcomeTemplate({
  name: 'Jane Doe',
  loginIdentifier: 'jane.doe@example.com',
  matricNumber: 'STU123456',
  tempPassword: 'Ab3!xY7qP0',
});

console.log('--- Student Template Subject ---\n', student.subject);
console.log('--- Student Text ---\n', student.text);
console.log('--- Student HTML (first 200 chars) ---\n', student.html.slice(0, 200));

const staff = staffWelcomeTemplate({
  name: 'John Smith',
  loginIdentifier: 'john.smith',
  staffEmail: 'john.smith@school.edu',
  tempPassword: 'Zx9!Lm2qRt',
});

console.log('--- Staff Template Subject ---\n', staff.subject);
console.log('--- Staff Text ---\n', staff.text);
console.log('--- Staff HTML (first 200 chars) ---\n', staff.html.slice(0, 200));
