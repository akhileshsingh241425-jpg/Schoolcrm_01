import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Database
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'school_crm')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-secret')
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
    PAYTM_ENV = os.getenv('PAYTM_ENV', 'staging')  # staging or production
    
    # Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Tata Telebusiness WhatsApp Cloud API
    WHATSAPP_API_URL = os.getenv('WHATSAPP_API_URL', 'https://wb.omni.tatatelebusiness.com/whatsapp-cloud/messages')
    WHATSAPP_AUTH_TOKEN = os.getenv('WHATSAPP_AUTH_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZU51bWJlciI6Iis5MTg1MjcyODg5MzgiLCJwaG9uZU51bWJlcklkIjoiNDgwNTg4MDkxNzk5NDkwIiwiaWF0IjoxNzI4NTU3MDQ3fQ.jOY6HSv88KZja3dsml3EaUQWrepRDhezsSMZ5IfcUZo')
    WHATSAPP_PHONE = os.getenv('WHATSAPP_PHONE', '+918527288938')
    WHATSAPP_TEMPLATE = os.getenv('WHATSAPP_TEMPLATE', 'pack_dispatch')

    # IVR Solutions Click-to-Call API
    IVR_API_URL = os.getenv('IVR_API_URL', 'https://api.ivrsolutions.in/api/c2c_get')
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


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
