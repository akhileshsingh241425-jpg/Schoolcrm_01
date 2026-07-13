import os
import secrets
import urllib.parse
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    # Database
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'school_crm')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_DECODE_ALGORITHMS = ['HS256']

    # Mail
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

    # Razorpay
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

    # Paytm
    PAYTM_MERCHANT_ID = os.getenv('PAYTM_MERCHANT_ID')
    PAYTM_MERCHANT_KEY = os.getenv('PAYTM_MERCHANT_KEY')
    PAYTM_WEBSITE = os.getenv('PAYTM_WEBSITE', 'DEFAULT')
    PAYTM_INDUSTRY_TYPE = os.getenv('PAYTM_INDUSTRY_TYPE', 'Education')
    PAYTM_ENV = os.getenv('PAYTM_ENV', 'staging')

    # Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 50 * 1024 * 1024))

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # WhatsApp
    WHATSAPP_API_URL = os.getenv('WHATSAPP_API_URL', '')
    WHATSAPP_AUTH_TOKEN = os.getenv('WHATSAPP_AUTH_TOKEN', '')
    WHATSAPP_PHONE = os.getenv('WHATSAPP_PHONE', '')
    WHATSAPP_TEMPLATE = os.getenv('WHATSAPP_TEMPLATE', 'pack_dispatch')

    # IVR
    IVR_API_URL = os.getenv('IVR_API_URL', '')
    IVR_API_TOKEN = os.getenv('IVR_API_TOKEN', '')
    IVR_DID_NO = os.getenv('IVR_DID_NO', '')
    IVR_EXT_NO = os.getenv('IVR_EXT_NO', '')

    # SQLAlchemy Connection Pooling
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,
        'pool_recycle': 3600,
        'max_overflow': 40,
        'pool_pre_ping': True,
        'pool_timeout': 30,
    }


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SECRET_KEY = os.getenv('SECRET_KEY') or secrets.token_hex(32)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or secrets.token_hex(32)
    _pwd = os.getenv('DB_PASSWORD')
    if not _pwd:
        raise RuntimeError(
            "Development mode requires MySQL. Set DB_PASSWORD in .env. "
            "Example: DB_PASSWORD=root"
        )
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{BaseConfig.DB_USER}:{urllib.parse.quote(_pwd, safe='')}"
        f"@{BaseConfig.DB_HOST}:{BaseConfig.DB_PORT}/{BaseConfig.DB_NAME}"
    )


class ProductionConfig(BaseConfig):
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    _pwd_prod = os.environ.get('DB_PASSWORD', '')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or (
        f"mysql+pymysql://{BaseConfig.DB_USER}:{urllib.parse.quote(_pwd_prod, safe='')}"
        f"@{BaseConfig.DB_HOST}:{BaseConfig.DB_PORT}/{BaseConfig.DB_NAME}"
    )

    @classmethod
    def validate(cls):
        missing = []
        if not cls.SECRET_KEY:
            missing.append('SECRET_KEY')
        if not cls.JWT_SECRET_KEY:
            missing.append('JWT_SECRET_KEY')
        if not cls.DB_PASSWORD:
            missing.append('DB_PASSWORD')
        if missing:
            raise RuntimeError(
                f"Production config requires: {', '.join(missing)}. "
                f"Set them in environment or .env file."
            )


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
