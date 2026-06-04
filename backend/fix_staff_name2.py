"""Fix remaining .name references on Staff objects in academic.py"""
filepath = 'app/models/academic.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

fixes = [
    ("'staff_name': self.staff.name if self.staff else None",
     "'staff_name': f\"{self.staff.first_name} {self.staff.last_name or ''}\".strip() if self.staff else None"),
    ("'reporter_name': self.reporter.name if self.reporter else None",
     "'reporter_name': f\"{self.reporter.first_name} {self.reporter.last_name or ''}\".strip() if self.reporter else None"),
    ("'uploader_name': self.uploader.name if self.uploader else None",
     "'uploader_name': f\"{self.uploader.first_name} {self.uploader.last_name or ''}\".strip() if self.uploader else None"),
]

total = 0
for old, new in fixes:
    count = content.count(old)
    content = content.replace(old, new)
    total += count

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Fixed {total} more occurrences')
