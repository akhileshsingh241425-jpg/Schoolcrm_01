"""Patch communication.py: update api-config key + add WhatsApp test route"""

filepath = r'd:\software\school CRM\backend\app\routes\communication.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the config key reference
content = content.replace(
    "current_app.config.get('SENSIBOT_API_TOKEN')",
    "current_app.config.get('WHATSAPP_AUTH_TOKEN')"
)

# 2. Add test WhatsApp route at end of file
test_route = '''

# ── WhatsApp Test Send ───────────────────────────────────
@communication_bp.route('/whatsapp/test', methods=['POST'])
@role_required('school_admin', 'super_admin')
def test_whatsapp():
    """Send a test WhatsApp message to verify API integration"""
    data = request.get_json() or {}
    phone = data.get('phone', '9773983859')

    template_params = {
        'header_text': 'School CRM Test',
        'param1': 'Test Notification',
        'param2': 'System Check',
        'param3': 'All OK',
        'param4': 'This is a test message from School CRM'
    }

    success, result = send_whatsapp(phone, '', template_params=template_params)

    if success:
        return success_response({'result': str(result)}, 'WhatsApp test message sent successfully')
    else:
        return error_response(f'WhatsApp test failed: {result}', 500)
'''

if 'def test_whatsapp' not in content:
    content = content.rstrip() + '\n' + test_route
    print("Added test_whatsapp route")
else:
    print("test_whatsapp route already exists")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: communication.py patched")
