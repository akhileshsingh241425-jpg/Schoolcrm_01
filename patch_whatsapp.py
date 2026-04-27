"""Patch helpers.py to replace SensiBOT WhatsApp with Tata Telebusiness API"""
import re

filepath = r'd:\software\school CRM\backend\app\utils\helpers.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the entire send_whatsapp function
old_pattern = r'def send_whatsapp\(phone, message\):.*?(?=\ndef |\Z)'

new_func = '''def send_whatsapp(phone, message, template_params=None):
    """Send WhatsApp message via Tata Telebusiness Omni WhatsApp Cloud API.
    Uses template-based messaging with 'pack_dispatch' template.
    template_params: dict with keys header_text, param1, param2, param3, param4
    If template_params not provided, auto-generates from message text.
    """
    api_url = current_app.config.get('WHATSAPP_API_URL')
    auth_token = current_app.config.get('WHATSAPP_AUTH_TOKEN', '')
    template_name = current_app.config.get('WHATSAPP_TEMPLATE', 'pack_dispatch')

    # Clean phone number - ensure country code, digits only
    clean_phone = phone.strip().replace(' ', '').replace('-', '').replace('+', '')
    if not clean_phone.startswith('91'):
        clean_phone = '91' + clean_phone.lstrip('0')

    if not auth_token:
        current_app.logger.warning('[WhatsApp] Tata Telebusiness not configured. Set WHATSAPP_AUTH_TOKEN')
        return False, 'WhatsApp API not configured'

    # Build template parameters
    if not template_params:
        # Auto-generate from message text - split into parts for pack_dispatch template
        lines = message.strip().split('\\n')
        header_text = lines[0][:60] if lines else 'School Notification'
        param1 = lines[1] if len(lines) > 1 else message[:100]
        param2 = lines[2] if len(lines) > 2 else '-'
        param3 = lines[3] if len(lines) > 3 else '-'
        param4 = lines[4] if len(lines) > 4 else '-'
    else:
        header_text = template_params.get('header_text', 'School Notification')
        param1 = template_params.get('param1', '-')
        param2 = template_params.get('param2', '-')
        param3 = template_params.get('param3', '-')
        param4 = template_params.get('param4', '-')

    payload = {
        "to": clean_phone,
        "type": "template",
        "source": "external",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "header",
                    "parameters": [
                        {"type": "text", "text": str(header_text)}
                    ]
                },
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": str(param1)},
                        {"type": "text", "text": str(param2)},
                        {"type": "text", "text": str(param3)},
                        {"type": "text", "text": str(param4)}
                    ]
                }
            ]
        }
    }

    try:
        import requests as http_requests
        resp = http_requests.post(
            api_url,
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {auth_token}'
            },
            timeout=15
        )

        if resp.status_code in (200, 201):
            data = resp.json()
            current_app.logger.info(f'[WhatsApp] Tata API success for {clean_phone}: {data}')
            return True, data
        else:
            current_app.logger.error(f'[WhatsApp] Tata API failed: {resp.status_code} - {resp.text}')
            return False, resp.text
    except Exception as e:
        current_app.logger.error(f'WhatsApp send failed: {str(e)}')
        return False, str(e)


'''

match = re.search(old_pattern, content, re.DOTALL)
if match:
    content = content[:match.start()] + new_func + content[match.end():]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: send_whatsapp updated to Tata Telebusiness API")
else:
    print("ERROR: Could not find send_whatsapp function")
