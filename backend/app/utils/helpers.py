from flask import request, jsonify, current_app
from flask_mail import Message


def paginate(query, schema=None):
    """Helper to paginate SQLAlchemy queries"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # Max 100 items per page
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    items = [item.to_dict() for item in pagination.items]
    
    return {
        'items': items,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }


def success_response(data=None, message='Success', status_code=200):
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code


def error_response(message='Error', status_code=400, errors=None):
    response = {'success': False, 'message': message}
    if errors:
        response['errors'] = errors
    return jsonify(response), status_code


def send_email(to, subject, body, html=None):
    """Send email using Flask-Mail. Returns (success, error_message)"""
    from app import mail
    try:
        sender = current_app.config.get('MAIL_USERNAME')
        if not sender:
            return False, 'MAIL_USERNAME not configured'
        msg = Message(subject=subject, sender=sender, recipients=[to] if isinstance(to, str) else to)
        msg.body = body
        if html:
            msg.html = html
        mail.send(msg)
        return True, None
    except Exception as e:
        current_app.logger.error(f'Email send failed: {str(e)}')
        return False, str(e)


def send_whatsapp(phone, message, template_params=None):
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
        lines = message.strip().split('\n')
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



def make_ivr_call(phone):
    """Initiate Click-to-Call via IVR Solutions API.
    Configure IVR_API_TOKEN, IVR_DID_NO, IVR_EXT_NO in environment.
    """
    api_url = current_app.config.get('IVR_API_URL', 'https://api.ivrsolutions.in/api/c2c_get')
    api_token = current_app.config.get('IVR_API_TOKEN', '')
    did_no = current_app.config.get('IVR_DID_NO', '')
    ext_no = current_app.config.get('IVR_EXT_NO', '')

    if not api_token or not did_no:
        current_app.logger.info(f'[IVR] Call to: {phone} (IVR not configured)')
        return False, 'IVR API not configured'

    try:
        import requests as http_requests
        clean_phone = phone.strip().replace(' ', '').replace('-', '')

        resp = http_requests.get(api_url, params={
            'token': api_token,
            'did': did_no,
            'ext_no': ext_no,
            'phone': clean_phone
        }, timeout=15)
        if resp.status_code in (200, 201):
            return True, None
        return False, resp.text
    except Exception as e:
        current_app.logger.error(f'IVR call failed: {str(e)}')
        return False, str(e)
