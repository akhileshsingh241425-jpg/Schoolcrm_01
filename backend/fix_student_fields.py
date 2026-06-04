"""Fix Student.query.filter_by with wrong field names in academics.py"""
filepath = 'app/routes/academics.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix class_id=sec.class_id, section_id=sec.id -> current_class_id, current_section_id
old = "Student.query.filter_by(school_id=g.school_id, class_id=sec.class_id, section_id=sec.id, status='active').count()"
new = "Student.query.filter_by(school_id=g.school_id, current_class_id=sec.class_id, current_section_id=sec.id, status='active').count()"
count = content.count(old)
content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Fixed {count} occurrences')
