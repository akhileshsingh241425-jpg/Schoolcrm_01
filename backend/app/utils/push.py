import requests
from app.models.device_token import DeviceToken

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


def send_push(user_ids, title, body, data=None):
    """Best-effort push notification to every device of the given users.

    Never raises - a push failure should never break the API call that
    triggered it (e.g. posting a notice still succeeds even if push
    delivery fails or no devices are registered).
    """
    if not user_ids:
        return
    try:
        tokens = [
            t.expo_push_token
            for t in DeviceToken.query.filter(DeviceToken.user_id.in_(user_ids)).all()
        ]
        if not tokens:
            return
        messages = [
            {'to': token, 'title': title, 'body': body, 'data': data or {}, 'sound': 'default'}
            for token in tokens
        ]
        # Expo accepts up to 100 messages per request.
        for i in range(0, len(messages), 100):
            requests.post(
                EXPO_PUSH_URL,
                json=messages[i:i + 100],
                headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
                timeout=10,
            )
    except Exception:
        pass
