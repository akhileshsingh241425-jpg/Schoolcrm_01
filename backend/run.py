import os
from app import create_app
from cli import init_app as init_cli

config_name = os.getenv('FLASK_ENV', 'production')
app = create_app(config_name)
init_cli(app)

if __name__ == '__main__':
    debug = config_name == 'development'
    app.run(debug=debug, port=5000)
