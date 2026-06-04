"""Fix self.teacher.name -> proper first_name + last_name in academic.py"""
filepath = 'app/models/academic.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old = "'teacher_name': self.teacher.name if self.teacher else None"
new = "'teacher_name': f\"{self.teacher.first_name} {self.teacher.last_name or ''}\".strip() if self.teacher else None"

count = content.count(old)
content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Fixed {count} occurrences')
